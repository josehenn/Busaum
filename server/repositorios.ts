// Composition root dos repositórios: a única instância de cada implementação
// Prisma. Os index.ts dos módulos montam seus services a partir daqui — assim um
// service pode depender do repositório de outro módulo sem ciclo de import.
import { prisma } from "@/lib/prisma";
import { PrismaAlunoRepository } from "./alunos/prisma-aluno.repository";
import { PrismaDeclaracaoRepository } from "./declaracoes/prisma-declaracao.repository";
import { PrismaDespesaRepository } from "./despesas/prisma-despesa.repository";
import { PrismaInstituicaoRepository } from "./instituicoes/prisma-instituicao.repository";
import { PrismaJustificativaRepository } from "./justificativas/prisma-justificativa.repository";
import { PrismaMensalidadeRepository } from "./mensalidades/prisma-mensalidade.repository";
import { PrismaPlanoRepository } from "./planos/prisma-plano.repository";
import { PrismaPontoRepository } from "./pontos/prisma-ponto.repository";
import { PrismaRotaRepository } from "./rotas/prisma-rota.repository";
import { PrismaVeiculoRepository } from "./veiculos/prisma-veiculo.repository";
import { PrismaViagemRepository } from "./viagens/prisma-viagem.repository";

export const repositorios = {
  alunos: new PrismaAlunoRepository(prisma),
  declaracoes: new PrismaDeclaracaoRepository(prisma),
  despesas: new PrismaDespesaRepository(prisma),
  instituicoes: new PrismaInstituicaoRepository(prisma),
  justificativas: new PrismaJustificativaRepository(prisma),
  mensalidades: new PrismaMensalidadeRepository(prisma),
  planos: new PrismaPlanoRepository(prisma),
  pontos: new PrismaPontoRepository(prisma),
  rotas: new PrismaRotaRepository(prisma),
  veiculos: new PrismaVeiculoRepository(prisma),
  viagens: new PrismaViagemRepository(prisma),
};
