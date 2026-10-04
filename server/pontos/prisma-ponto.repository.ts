import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import type { AtualizarPontoDTO, CriarPontoDTO, FiltroPontos } from "@/lib/esquemas/ponto";
import type { IPontoRepository, Ponto } from "./ponto.repository";

const incluir = {
  instituicao: { select: { id: true, nome: true, sigla: true } },
  rotaPontos: { select: { rota: { select: { id: true, nome: true, ativa: true } } } },
} satisfies Prisma.PontoInclude;

type PontoPrisma = Prisma.PontoGetPayload<{ include: typeof incluir }>;

function paraEntidade({ rotaPontos, ...ponto }: PontoPrisma): Ponto {
  return { ...ponto, rotas: rotaPontos.map((rp) => rp.rota) };
}

export class PrismaPontoRepository implements IPontoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listar({ busca, status }: FiltroPontos) {
    const pontos = await this.prisma.ponto.findMany({
      where: {
        ...(status && { ativo: status === "ATIVO" }),
        ...(busca && {
          OR: [
            { descricao: { contains: busca, mode: "insensitive" } },
            { logradouro: { contains: busca, mode: "insensitive" } },
            { bairro: { contains: busca, mode: "insensitive" } },
            { cidade: { contains: busca, mode: "insensitive" } },
          ],
        }),
      },
      include: incluir,
      orderBy: [{ ativo: "desc" }, { descricao: "asc" }],
    });
    return pontos.map(paraEntidade);
  }

  async listarAtivos() {
    const pontos = await this.prisma.ponto.findMany({
      where: { ativo: true },
      include: incluir,
      orderBy: { descricao: "asc" },
    });
    return pontos.map(paraEntidade);
  }

  async buscarPorId(id: string) {
    const ponto = await this.prisma.ponto.findUnique({ where: { id }, include: incluir });
    return ponto && paraEntidade(ponto);
  }

  async criar(dados: CriarPontoDTO & { criadoPor: string }) {
    return paraEntidade(await this.prisma.ponto.create({ data: dados, include: incluir }));
  }

  async atualizar(id: string, dados: AtualizarPontoDTO) {
    return paraEntidade(await this.prisma.ponto.update({ where: { id }, data: dados, include: incluir }));
  }
}
