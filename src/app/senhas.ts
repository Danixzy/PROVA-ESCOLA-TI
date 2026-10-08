import type { Prisma, Senha, TipoSenha } from '@prisma/client';
import { params } from './config';
import { prisma } from './db';
import { HttpError } from './errors';
import { comLock } from './lock';
import { diaBrasilia, isoBrasilia } from './time';

type Tx = Prisma.TransactionClient;

export function paraJson(s: Senha) {
  return {
    codigo: s.codigo,
    tipo: s.tipo,
    emissao: isoBrasilia(s.emissao),
    status: s.status,
    ...(s.chamadaEm ? { chamada_em: isoBrasilia(s.chamadaEm) } : {}),
  };
}

async function proximoValor(tx: Tx, chave: string): Promise<number> {
  const c = await tx.contador.upsert({
    where: { chave },
    create: { chave, valor: 1 },
    update: { valor: { increment: 1 } },
  });
  return c.valor;
}

async function buscar(tx: Tx, codigo: string): Promise<Senha> {
  const s = await tx.senha.findFirst({ where: { codigo }, orderBy: { id: 'desc' } });
  if (!s) throw new HttpError(404, 'senha_nao_encontrada');
  return s;
}

export function emitir(tipo: TipoSenha): Promise<Senha> {
  return comLock(() =>
    prisma.$transaction(async (tx) => {
      const agora = new Date();
      const dia = diaBrasilia(agora);
      const seq = await proximoValor(tx, `seq:${dia}`);
      const codigo = `${params.PREFIXO}${String(seq).padStart(3, '0')}`;
      return tx.senha.create({ data: { codigo, dia, tipo, emissao: agora } });
    }),
  );
}

export function chamarProxima(): Promise<Senha> {
  return comLock(() =>
    prisma.$transaction(async (tx) => {
      const primeira = (tipo: TipoSenha) =>
        tx.senha.findFirst({ where: { status: 'aguardando', tipo }, orderBy: { id: 'asc' } });
      const pref = await primeira('preferencial');
      const normal = await primeira('normal');

      const razao = params.RAZAO_PREFERENCIAL;
      const ciclo = (await tx.contador.findUnique({ where: { chave: 'ciclo_pref' } }))?.valor ?? 0;

      let escolhida: Senha;
      let novoCiclo: number;
      if (pref && (ciclo < razao || !normal)) {
        escolhida = pref;
        novoCiclo = Math.min(ciclo + 1, razao);
      } else if (normal) {
        escolhida = normal;
        novoCiclo = 0;
      } else {
        throw new HttpError(404, 'fila_vazia');
      }

      await tx.contador.upsert({
        where: { chave: 'ciclo_pref' },
        create: { chave: 'ciclo_pref', valor: novoCiclo },
        update: { valor: novoCiclo },
      });
      const ordem = await proximoValor(tx, 'ordem_chamada');
      return tx.senha.update({
        where: { id: escolhida.id },
        data: { status: 'chamada', chamadaEm: new Date(), ordemChamada: ordem },
      });
    }),
  );
}

export function concluir(codigo: string): Promise<Senha> {
  return comLock(() =>
    prisma.$transaction(async (tx) => {
      const s = await buscar(tx, codigo);
      if (s.status !== 'chamada') throw new HttpError(409, 'senha_nao_chamada');
      return tx.senha.update({ where: { id: s.id }, data: { status: 'concluida' } });
    }),
  );
}

export function rechamar(codigo: string): Promise<Senha> {
  return comLock(() =>
    prisma.$transaction(async (tx) => {
      const s = await buscar(tx, codigo);
      if (s.status !== 'chamada') throw new HttpError(409, 'senha_nao_chamada');
      const ordem = await proximoValor(tx, 'ordem_chamada');
      return tx.senha.update({
        where: { id: s.id },
        data: { chamadaEm: new Date(), ordemChamada: ordem },
      });
    }),
  );
}

export function cancelar(codigo: string): Promise<Senha> {
  return comLock(() =>
    prisma.$transaction(async (tx) => {
      const s = await buscar(tx, codigo);
      if (s.status !== 'aguardando') throw new HttpError(409, 'senha_nao_aguardando');
      return tx.senha.update({ where: { id: s.id }, data: { status: 'cancelada' } });
    }),
  );
}

export function painel(): Promise<Senha[]> {
  return prisma.senha.findMany({
    where: { ordemChamada: { not: null } },
    orderBy: { ordemChamada: 'desc' },
    take: 5,
  });
}
