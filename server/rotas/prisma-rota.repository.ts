import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { StatusViagem } from "@/lib/generated/prisma/enums";
import { horarioParaTime } from "@/lib/datas";
import type { AtualizarRotaDTO, CriarRotaDTO } from "@/lib/esquemas/rota";
import type { IRotaRepository, Rota } from "./rota.repository";

const incluir = {
  veiculo: {
    select: { id: true, placa: true, modelo: true, tipo: true, capacidade: true, status: true },
  },
  pontos: {
    orderBy: { ordem: "asc" },
    select: {
      ordem: true,
      ponto: { select: { id: true, descricao: true, instituicaoId: true, ativo: true } },
    },
  },
  _count: { select: { planos: { where: { vigenteAte: null } } } },
} satisfies Prisma.RotaInclude;

type RotaPrisma = Prisma.RotaGetPayload<{ include: typeof incluir }>;

function paraEntidade({ pontos, _count, ...rota }: RotaPrisma): Rota {
  return {
    ...rota,
    pontos: pontos.map(({ ordem, ponto }) => ({ ordem, ...ponto })),
    planosAbertos: _count.planos,
  };
}

/** "hh:mm" → @db.Time, só nos campos que vieram. */
function horarios(dados: { horarioIda?: string; horarioVolta?: string }) {
  return {
    ...(dados.horarioIda && { horarioIda: horarioParaTime(dados.horarioIda) }),
    ...(dados.horarioVolta && { horarioVolta: horarioParaTime(dados.horarioVolta) }),
  };
}

export class PrismaRotaRepository implements IRotaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listar() {
    const rotas = await this.prisma.rota.findMany({
      include: incluir,
      orderBy: [{ ativa: "desc" }, { nome: "asc" }],
    });
    return rotas.map(paraEntidade);
  }

  async buscarPorId(id: string) {
    const rota = await this.prisma.rota.findUnique({ where: { id }, include: incluir });
    return rota && paraEntidade(rota);
  }

  async criar({ pontos, horarioIda, horarioVolta, ...dados }: CriarRotaDTO & { criadoPor: string }) {
    const rota = await this.prisma.rota.create({
      data: {
        ...dados,
        horarioIda: horarioParaTime(horarioIda),
        horarioVolta: horarioParaTime(horarioVolta),
        pontos: { create: pontos.map((pontoId, i) => ({ pontoId, ordem: i + 1 })) },
      },
      include: incluir,
    });
    return paraEntidade(rota);
  }

  async atualizar(
    id: string,
    { pontos, horarioIda, horarioVolta, ...dados }: AtualizarRotaDTO,
    { replanejarViagens }: { replanejarViagens: boolean },
  ) {
    const rota = await this.prisma.$transaction(async (tx) => {
      if (pontos) {
        // Trajeto é substituído inteiro: apagar e recriar é mais simples que
        // reordenar respeitando o @@unique(rotaId, ordem).
        await tx.rotaPonto.deleteMany({ where: { rotaId: id } });
        await tx.rotaPonto.createMany({
          data: pontos.map((pontoId, i) => ({ rotaId: id, pontoId, ordem: i + 1 })),
        });
      }
      if (replanejarViagens) {
        await tx.viagem.deleteMany({
          where: {
            rotaId: id,
            status: StatusViagem.AGENDADA,
            horarioIda: { gt: new Date() },
            declaracoes: { none: {} },
            diarias: { none: {} },
          },
        });
      }
      return tx.rota.update({
        where: { id },
        data: { ...dados, ...horarios({ horarioIda, horarioVolta }) },
        include: incluir,
      });
    });
    return paraEntidade(rota);
  }
}
