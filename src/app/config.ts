import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const ParamsSchema = z.object({
  PREFIXO: z.string().regex(/^[A-Z]$/),
  RAZAO_PREFERENCIAL: z.coerce.number().int().positive(),
});

export type Params = z.infer<typeof ParamsSchema>;

function localizarParams(): string {
  const candidatos = [
    process.env.PARAMS_PATH,
    path.resolve(process.cwd(), 'variante/params.json'),
    path.resolve(process.cwd(), '../variante/params.json'),
  ].filter((p): p is string => Boolean(p));

  const achado = candidatos.find((p) => existsSync(p));
  if (!achado) {
    throw new Error(`params.json não encontrado. Procurado em: ${candidatos.join(', ')}`);
  }
  return achado;
}

export const params: Params = ParamsSchema.parse(
  JSON.parse(readFileSync(localizarParams(), 'utf8')),
);
