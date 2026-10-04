-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'ALUNO');

-- CreateEnum
CREATE TYPE "StatusAluno" AS ENUM ('ATIVO', 'INATIVO', 'TRANCADO');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MATUTINO', 'VESPERTINO', 'NOTURNO');

-- CreateEnum
CREATE TYPE "TipoVeiculo" AS ENUM ('ONIBUS', 'VAN');

-- CreateEnum
CREATE TYPE "StatusVeiculo" AS ENUM ('ATIVO', 'MANUTENCAO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusViagem" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "OrigemDeclaracao" AS ENUM ('ALUNO', 'ADMIN');

-- CreateEnum
CREATE TYPE "MotivoJustificativa" AS ENUM ('ATESTADO', 'AULA_CANCELADA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusJustificativa" AS ENUM ('PENDENTE', 'APROVADA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "SituacaoDiaria" AS ENUM ('COBRADA', 'ISENTA_JUSTIFICADA', 'ISENTA_VIAGEM_CANCELADA');

-- CreateEnum
CREATE TYPE "StatusMensalidade" AS ENUM ('ABERTA', 'PAGA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('COMBUSTIVEL', 'MANUTENCAO', 'PEDAGIO', 'SEGURO', 'SALARIO', 'OUTROS');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "imagem" TEXT,
    "perfil" "PerfilUsuario" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instituicao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "instituicaoId" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "turno" "Turno" NOT NULL,
    "status" "StatusAluno" NOT NULL DEFAULT 'ATIVO',
    "inicioEm" TIMESTAMP(3) NOT NULL,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" "TipoVeiculo" NOT NULL,
    "modelo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "status" "StatusVeiculo" NOT NULL DEFAULT 'ATIVO',
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rota" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "horarioIda" TIME NOT NULL,
    "horarioVolta" TIME NOT NULL,
    "diasOperacao" INTEGER[],
    "antecedenciaMinutos" INTEGER NOT NULL,
    "valorDiaria" DECIMAL(10,2) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ponto" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "referencia" TEXT,
    "instituicaoId" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ponto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RotaPonto" (
    "id" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "pontoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RotaPonto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoRota" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "pontoEmbarqueId" TEXT NOT NULL,
    "pontoDestinoId" TEXT NOT NULL,
    "pontoRetornoId" TEXT,
    "diasSemana" INTEGER[],
    "vigenteDe" TIMESTAMP(3) NOT NULL,
    "vigenteAte" TIMESTAMP(3),
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoRota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viagem" (
    "id" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "horarioIda" TIMESTAMP(3) NOT NULL,
    "horarioVolta" TIMESTAMP(3) NOT NULL,
    "prazoDeclaracao" TIMESTAMP(3) NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "status" "StatusViagem" NOT NULL DEFAULT 'AGENDADA',
    "motivoCancelamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Viagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Declaracao" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "usaIda" BOOLEAN NOT NULL,
    "usaVolta" BOOLEAN NOT NULL,
    "origem" "OrigemDeclaracao" NOT NULL,
    "declaradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Declaracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Justificativa" (
    "id" TEXT NOT NULL,
    "declaracaoId" TEXT NOT NULL,
    "motivo" "MotivoJustificativa" NOT NULL,
    "descricao" TEXT NOT NULL,
    "anexoUrl" TEXT NOT NULL,
    "status" "StatusJustificativa" NOT NULL DEFAULT 'PENDENTE',
    "observacaoDecisao" TEXT,
    "decididoPor" TEXT,
    "decididoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Justificativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensalidade" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "diariasCobradas" INTEGER NOT NULL,
    "diariasIsentas" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "ajuste" DECIMAL(10,2),
    "motivoAjuste" TEXT,
    "ajustadoPor" TEXT,
    "ajustadoEm" TIMESTAMP(3),
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimentoEm" TIMESTAMP(3) NOT NULL,
    "status" "StatusMensalidade" NOT NULL DEFAULT 'ABERTA',
    "pagoEm" TIMESTAMP(3),
    "referenciaGateway" TEXT,
    "baixaPor" TEXT,
    "baixaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mensalidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diaria" (
    "id" TEXT NOT NULL,
    "mensalidadeId" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "planoRotaId" TEXT,
    "data" DATE NOT NULL,
    "valorDiaria" DECIMAL(10,2) NOT NULL,
    "situacao" "SituacaoDiaria" NOT NULL,
    "justificativaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT,
    "categoria" "CategoriaDespesa" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" DATE NOT NULL,
    "comprovanteUrl" TEXT,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instituicao_nome_key" ON "Instituicao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_usuarioId_key" ON "Aluno"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_cpf_key" ON "Aluno"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "RotaPonto_rotaId_ordem_key" ON "RotaPonto"("rotaId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "RotaPonto_rotaId_pontoId_key" ON "RotaPonto"("rotaId", "pontoId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoRota_alunoId_rotaId_vigenteDe_key" ON "PlanoRota"("alunoId", "rotaId", "vigenteDe");

-- CreateIndex
CREATE UNIQUE INDEX "Viagem_rotaId_data_key" ON "Viagem"("rotaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Declaracao_viagemId_alunoId_key" ON "Declaracao"("viagemId", "alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "Justificativa_declaracaoId_key" ON "Justificativa"("declaracaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Mensalidade_alunoId_competencia_key" ON "Mensalidade"("alunoId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "Diaria_mensalidadeId_viagemId_key" ON "Diaria"("mensalidadeId", "viagemId");

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rota" ADD CONSTRAINT "Rota_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ponto" ADD CONSTRAINT "Ponto_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaPonto" ADD CONSTRAINT "RotaPonto_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "Rota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaPonto" ADD CONSTRAINT "RotaPonto_pontoId_fkey" FOREIGN KEY ("pontoId") REFERENCES "Ponto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoRota" ADD CONSTRAINT "PlanoRota_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoRota" ADD CONSTRAINT "PlanoRota_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "Rota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoRota" ADD CONSTRAINT "PlanoRota_pontoEmbarqueId_fkey" FOREIGN KEY ("pontoEmbarqueId") REFERENCES "Ponto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoRota" ADD CONSTRAINT "PlanoRota_pontoDestinoId_fkey" FOREIGN KEY ("pontoDestinoId") REFERENCES "Ponto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoRota" ADD CONSTRAINT "PlanoRota_pontoRetornoId_fkey" FOREIGN KEY ("pontoRetornoId") REFERENCES "Ponto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viagem" ADD CONSTRAINT "Viagem_rotaId_fkey" FOREIGN KEY ("rotaId") REFERENCES "Rota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viagem" ADD CONSTRAINT "Viagem_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaracao" ADD CONSTRAINT "Declaracao_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaracao" ADD CONSTRAINT "Declaracao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Justificativa" ADD CONSTRAINT "Justificativa_declaracaoId_fkey" FOREIGN KEY ("declaracaoId") REFERENCES "Declaracao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensalidade" ADD CONSTRAINT "Mensalidade_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diaria" ADD CONSTRAINT "Diaria_mensalidadeId_fkey" FOREIGN KEY ("mensalidadeId") REFERENCES "Mensalidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diaria" ADD CONSTRAINT "Diaria_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "Viagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diaria" ADD CONSTRAINT "Diaria_planoRotaId_fkey" FOREIGN KEY ("planoRotaId") REFERENCES "PlanoRota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diaria" ADD CONSTRAINT "Diaria_justificativaId_fkey" FOREIGN KEY ("justificativaId") REFERENCES "Justificativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Regras que o Prisma não expressa (docs/modelagem.md)
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_capacidade_positiva" CHECK ("capacidade" > 0);

-- Um aluno só pode ter um plano aberto por rota
CREATE UNIQUE INDEX "plano_aberto_unico"
  ON "PlanoRota" ("alunoId", "rotaId")
  WHERE "vigenteAte" IS NULL;
