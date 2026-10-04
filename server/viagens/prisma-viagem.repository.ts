import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { StatusViagem } from "@/lib/generated/prisma/enums";
import { diaSemanaIso, horaLocal, horarioLocal, somarDias } from "@/lib/datas";
import type { IViagemRepository, Viagem } from "./viagem.repository";

const incluir = {
  rota: {
    select: {
      id: true,
      nome: true,
      valorDiaria: true,
      pontos: {
        orderBy: { ordem: "asc" },
        select: { ordem: true, ponto: { select: { id: true, descricao: true } } },
      },
    },
  },
  veiculo: { select: { id: true, placa: true, modelo: true } },
} satisfies Prisma.ViagemInclude;

type ViagemPrisma = Prisma.ViagemGetPayload<{ include: typeof incluir }>;

function paraEntidade({ rota: { pontos, ...rota }, ...viagem }: ViagemPrisma): Viagem {
  return {
    ...viagem,
    rota: { ...rota, pontos: pontos.map(({ ordem, ponto }) => ({ ordem, ...ponto })) },
  };
}

export class PrismaViagemRepository implements IViagemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async gerar(de: Date, ate: Date, agora: Date) {
    const rotas = await this.prisma.rota.findMany({
      where: { ativa: true },
      include: { veiculo: { select: { capacidade: true } } },
    });

    const dados: Prisma.ViagemCreateManyInput[] = [];
    for (const rota of rotas) {
      const ida = horarioLocal(rota.horarioIda);
      const volta = horarioLocal(rota.horarioVolta);
      for (let d = de; d <= ate; d = somarDias(d, 1)) {
        if (!rota.diasOperacao.includes(diaSemanaIso(d))) continue;
        const horarioIda = horaLocal(d, ida);
        const horarioVolta = horaLocal(d, volta);
        dados.push({
          rotaId: rota.id,
          veiculoId: rota.veiculoId,
          data: d,
          horarioIda,
          horarioVolta,
          prazoDeclaracao: new Date(horarioIda.getTime() - rota.antecedenciaMinutos * 60 * 1000),
          capacidade: rota.veiculo.capacidade,
          status: horarioVolta < agora ? StatusViagem.REALIZADA : StatusViagem.AGENDADA,
        });
      }
    }

    await this.prisma.$transaction([
      this.prisma.viagem.createMany({ data: dados, skipDuplicates: true }),
      this.prisma.viagem.updateMany({
        where: { status: StatusViagem.AGENDADA, horarioVolta: { lt: agora } },
        data: { status: StatusViagem.REALIZADA },
      }),
    ]);
  }

  async listar({ de, ate, rotaIds }: { de: Date; ate: Date; rotaIds?: string[] }) {
    const viagens = await this.prisma.viagem.findMany({
      where: { data: { gte: de, lte: ate }, ...(rotaIds && { rotaId: { in: rotaIds } }) },
      include: incluir,
      orderBy: [{ data: "asc" }, { horarioIda: "asc" }],
    });
    return viagens.map(paraEntidade);
  }

  async buscarPorId(id: string) {
    const viagem = await this.prisma.viagem.findUnique({ where: { id }, include: incluir });
    return viagem && paraEntidade(viagem);
  }

  async listarPlanos(rotaIds: string[], de: Date, ate: Date) {
    const planos = await this.prisma.planoRota.findMany({
      where: {
        rotaId: { in: rotaIds },
        // Margem de um dia: o prazo de declaração cai antes da meia-noite do dia.
        vigenteDe: { lte: somarDias(ate, 1) },
        OR: [{ vigenteAte: null }, { vigenteAte: { gte: somarDias(de, -1) } }],
      },
      include: { aluno: { select: { usuario: { select: { nome: true } } } } },
    });
    return planos.map(({ aluno, ...p }) => ({ ...p, alunoNome: aluno.usuario.nome }));
  }

  async listarDeclaracoes(viagemIds: string[]) {
    const declaracoes = await this.prisma.declaracao.findMany({
      where: { viagemId: { in: viagemIds } },
      include: { aluno: { select: { usuario: { select: { nome: true } } } } },
    });
    return declaracoes.map(({ aluno, ...d }) => ({ ...d, alunoNome: aluno.usuario.nome }));
  }

  async cancelar(id: string, motivo: string) {
    const viagem = await this.prisma.viagem.update({
      where: { id },
      data: { status: StatusViagem.CANCELADA, motivoCancelamento: motivo },
      include: incluir,
    });
    return paraEntidade(viagem);
  }

  async trocarVeiculo(id: string, veiculo: { id: string; capacidade: number }) {
    const viagem = await this.prisma.viagem.update({
      where: { id },
      data: { veiculoId: veiculo.id, capacidade: veiculo.capacidade },
      include: incluir,
    });
    return paraEntidade(viagem);
  }
}
