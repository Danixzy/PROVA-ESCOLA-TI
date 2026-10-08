-- CreateEnum
CREATE TYPE "TipoSenha" AS ENUM ('normal', 'preferencial');

-- CreateEnum
CREATE TYPE "StatusSenha" AS ENUM ('aguardando', 'chamada', 'concluida', 'cancelada');

-- CreateTable
CREATE TABLE "Senha" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "dia" TEXT NOT NULL,
    "tipo" "TipoSenha" NOT NULL,
    "status" "StatusSenha" NOT NULL DEFAULT 'aguardando',
    "emissao" TIMESTAMPTZ(3) NOT NULL,
    "chamadaEm" TIMESTAMPTZ(3),
    "ordemChamada" INTEGER,

    CONSTRAINT "Senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contador" (
    "chave" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Contador_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE INDEX "Senha_status_tipo_id_idx" ON "Senha"("status", "tipo", "id");

-- CreateIndex
CREATE INDEX "Senha_ordemChamada_idx" ON "Senha"("ordemChamada");

-- CreateIndex
CREATE UNIQUE INDEX "Senha_dia_codigo_key" ON "Senha"("dia", "codigo");
