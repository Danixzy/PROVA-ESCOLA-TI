import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly erro: string,
  ) {
    super(erro);
  }
}

function ehJsonInvalido(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed'
  );
}

export function naoEncontrado(_req: Request, res: Response): void {
  res.status(404).json({ erro: 'rota_nao_encontrada' });
}

export function tratarErros(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ erro: err.erro });
    return;
  }

  if (ehJsonInvalido(err)) {
    res.status(422).json({ erro: 'tipo_invalido' });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: 'erro_interno' });
}
