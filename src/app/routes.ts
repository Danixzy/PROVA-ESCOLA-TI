import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from './errors';
import { cancelar, chamarProxima, concluir, emitir, painel, paraJson, rechamar } from './senhas';

const EmitirBody = z.object({ tipo: z.enum(['normal', 'preferencial']) });

export const rotas = Router();

rotas.post('/senhas', async (req, res) => {
  const body = EmitirBody.safeParse(req.body);
  if (!body.success) throw new HttpError(422, 'tipo_invalido');
  res.status(201).json(paraJson(await emitir(body.data.tipo)));
});

rotas.get('/senhas/proxima', async (_req, res) => {
  res.status(200).json(paraJson(await chamarProxima()));
});

rotas.post('/senhas/:codigo/concluir', async (req, res) => {
  res.status(200).json(paraJson(await concluir(req.params.codigo)));
});

rotas.post('/senhas/:codigo/rechamar', async (req, res) => {
  res.status(200).json(paraJson(await rechamar(req.params.codigo)));
});

rotas.post('/senhas/:codigo/cancelar', async (req, res) => {
  res.status(200).json(paraJson(await cancelar(req.params.codigo)));
});

rotas.get('/painel', async (_req, res) => {
  const chamadas = await painel();
  res.status(200).json({ chamadas: chamadas.map(paraJson) });
});
