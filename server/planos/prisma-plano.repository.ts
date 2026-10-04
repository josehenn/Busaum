import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import type { DadosNovoPlano, IPlanoRepository, Plano } from "./plano.repository";

const ponto = { select: { id: true, descricao: true } } as const;
const incluir = {
  aluno: {
    select: { id: true, status: true, instituicaoId: true, usuario: { select: { nome: true } } },
  },
  rota: { select: { id: true, nome: true } },
  pontoEmbarque: ponto,
  pontoDestino: ponto,
  pontoRetorno: ponto,
} satisfies Prisma.PlanoRotaInclude;

type PlanoPrisma = Prisma.PlanoRotaGetPayload<{ include: typeof incluir }>;

function paraEntidade({ aluno: { usuario, ...aluno }, ...plano }: PlanoPrisma): Plano {
  return { ...plano, aluno: { ...aluno, nome: usuario.nome } };
}

export class PrismaPlanoRepository implements IPlanoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorId(id: string) {
    const plano = await this.prisma.planoRota.findUnique({ where: { id }, include: incluir });
    return plano && paraEntidade(plano);
  }

  async buscarAberto(alunoId: string, rotaId: string) {
    const plano = await this.prisma.planoRota.findFirst({
      where: { alunoId, rotaId, vigenteAte: null },
      include: incluir,
    });
    return plano && paraEntidade(plano);
  }

  async listarAbertosDaRota(rotaId: string) {
    const planos = await this.prisma.planoRota.findMany({
      where: { rotaId, vigenteAte: null },
      include: incluir,
      orderBy: { aluno: { usuario: { nome: "asc" } } },
    });
    return planos.map(paraEntidade);
  }

  async listarAbertosDoAluno(alunoId: string) {
    const planos = await this.prisma.planoRota.findMany({
      where: { alunoId, vigenteAte: null },
      include: incluir,
      orderBy: { rota: { nome: "asc" } },
    });
    return planos.map(paraEntidade);
  }

  async criar(dados: DadosNovoPlano, inicio: Date, encerrarId?: string) {
    const plano = await this.prisma.$transaction(async (tx) => {
      // Encerra antes de criar: o índice plano_aberto_unico não deixa existir
      // dois planos abertos do mesmo aluno na mesma rota.
      if (encerrarId) {
        await tx.planoRota.update({ where: { id: encerrarId }, data: { vigenteAte: inicio } });
      }
      return tx.planoRota.create({ data: { ...dados, vigenteDe: inicio }, include: incluir });
    });
    return paraEntidade(plano);
  }

  async encerrar(id: string, fim: Date) {
    return paraEntidade(
      await this.prisma.planoRota.update({ where: { id }, data: { vigenteAte: fim }, include: incluir }),
    );
  }
}
