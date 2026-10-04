import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import {
  OrigemDeclaracao,
  type MotivoJustificativa,
  type StatusJustificativa,
} from "@/lib/generated/prisma/enums";
import type { FiltroJustificativas } from "@/lib/esquemas/justificativa";
import type { IJustificativaRepository, Justificativa } from "./justificativa.repository";

const incluir = {
  declaracao: {
    select: {
      aluno: { select: { id: true, usuario: { select: { nome: true } } } },
      viagem: { select: { id: true, data: true, rota: { select: { nome: true } } } },
    },
  },
} satisfies Prisma.JustificativaInclude;

type JustificativaPrisma = Prisma.JustificativaGetPayload<{ include: typeof incluir }>;

function paraEntidade({ declaracao: { aluno, viagem }, ...j }: JustificativaPrisma): Justificativa {
  return {
    ...j,
    aluno: { id: aluno.id, nome: aluno.usuario.nome },
    viagem: { id: viagem.id, data: viagem.data, rotaNome: viagem.rota.nome },
  };
}

export class PrismaJustificativaRepository implements IJustificativaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listar({ busca, status, alunoId }: FiltroJustificativas & { alunoId?: string }) {
    const lista = await this.prisma.justificativa.findMany({
      where: {
        status,
        declaracao: {
          ...(alunoId && { alunoId }),
          ...(busca && { aluno: { usuario: { nome: { contains: busca, mode: "insensitive" } } } }),
        },
      },
      include: incluir,
      // Pendentes primeiro (ordem do enum), as mais antigas no topo da fila.
      orderBy: [{ status: "asc" }, { criadoEm: "asc" }],
    });
    return lista.map(paraEntidade);
  }

  async buscarPorId(id: string) {
    const j = await this.prisma.justificativa.findUnique({ where: { id }, include: incluir });
    return j && paraEntidade(j);
  }

  async historicoDoAluno(alunoId: string, de: Date, ate: Date) {
    const planos = await this.prisma.planoRota.findMany({
      where: { alunoId },
      include: { aluno: { select: { usuario: { select: { nome: true } } } } },
    });
    const viagens = await this.prisma.viagem.findMany({
      where: { rotaId: { in: [...new Set(planos.map((p) => p.rotaId))] }, data: { gte: de, lte: ate } },
      include: {
        rota: { select: { nome: true } },
        declaracoes: {
          where: { alunoId },
          select: { usaIda: true, usaVolta: true, canceladoEm: true, justificativa: { select: { id: true } } },
        },
      },
      orderBy: { data: "desc" },
    });

    return {
      planos: planos.map(({ aluno, ...p }) => ({ ...p, alunoNome: aluno.usuario.nome })),
      viagens: viagens.map(({ rota, declaracoes, ...v }) => {
        const d = declaracoes[0];
        return {
          id: v.id,
          rotaId: v.rotaId,
          rotaNome: rota.nome,
          data: v.data,
          prazoDeclaracao: v.prazoDeclaracao,
          horarioVolta: v.horarioVolta,
          status: v.status,
          declaracao: d
            ? { usaIda: d.usaIda, usaVolta: d.usaVolta, canceladoEm: d.canceladoEm, temJustificativa: d.justificativa !== null }
            : null,
        };
      }),
    };
  }

  async criar(dados: {
    viagemId: string;
    alunoId: string;
    motivo: MotivoJustificativa;
    descricao: string;
    anexoUrl: string;
    em: Date;
  }) {
    const { viagemId, alunoId, motivo, descricao, anexoUrl, em } = dados;
    return this.prisma.$transaction(async (tx) => {
      // Ausência do dia inteiro. Um aviso desfeito (canceladoEm) volta a valer.
      const declaracao = await tx.declaracao.upsert({
        where: { viagemId_alunoId: { viagemId, alunoId } },
        create: { viagemId, alunoId, usaIda: false, usaVolta: false, origem: OrigemDeclaracao.ALUNO, declaradoEm: em },
        update: { usaIda: false, usaVolta: false, canceladoEm: null },
      });
      const justificativa = await tx.justificativa.create({
        data: { declaracaoId: declaracao.id, motivo, descricao, anexoUrl },
      });
      return justificativa.id;
    });
  }

  async decidir(
    id: string,
    dados: { status: StatusJustificativa; observacao: string | null; por: string; em: Date },
  ) {
    await this.prisma.justificativa.update({
      where: { id },
      data: {
        status: dados.status,
        observacaoDecisao: dados.observacao,
        decididoPor: dados.por,
        decididoEm: dados.em,
      },
    });
  }

  async anexoEhDoAluno(anexoUrl: string, alunoId: string) {
    return (await this.prisma.justificativa.count({ where: { anexoUrl, declaracao: { alunoId } } })) > 0;
  }
}
