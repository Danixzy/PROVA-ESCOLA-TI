import express from 'express';
import { params } from './config';
import { prisma } from './db';
import { naoEncontrado, tratarErros } from './errors';
import { rotas } from './routes';

const app = express();
app.disable('x-powered-by');
app.use(express.json());

app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use(rotas);
app.use(naoEncontrado);
app.use(tratarErros);

const port = Number(process.env.PORT ?? 8080);
const server = app.listen(port, '0.0.0.0', () => {
  console.info(
    `API na porta ${port} — prefixo ${params.PREFIXO}, razão preferencial ${params.RAZAO_PREFERENCIAL}`,
  );
});

function shutdown(signal: string): void {
  console.info(`${signal} recebido, encerrando...`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
