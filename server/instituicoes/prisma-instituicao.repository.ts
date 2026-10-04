import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { ErroDeConflito } from "@/server/comum/erros";
import type { IInstituicaoRepository, Instituicao } from "./instituicao.repository";

const campos = { id: true, nome: true, sigla: true, cidade: true } as const;

export class PrismaInstituicaoRepository implements IInstituicaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listar(): Promise<Instituicao[]> {
    return this.prisma.instituicao.findMany({ select: campos, orderBy: { nome: "asc" } });
  }

  buscarPorId(id: string): Promise<Instituicao | null> {
    return this.prisma.instituicao.findUnique({ where: { id }, select: campos });
  }

  async criar(dados: { nome: string }): Promise<Instituicao> {
    try {
      return await this.prisma.instituicao.create({ data: dados, select: campos });
    } catch (erro) {
      // Corrida entre dois cadastros iguais: o @unique do nome é quem barra.
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
        throw new ErroDeConflito("Esta instituição já está cadastrada.", {
          nome: ["Esta instituição já está cadastrada."],
        });
      }
      throw erro;
    }
  }

  async buscarPorNomeOuSigla(texto: string): Promise<Instituicao | null> {
    // Duas consultas para o nome ter prioridade: se o texto for o nome de uma
    // instituição e a sigla de outra, quem tem aquele nome é a escolhida.
    const porNome = await this.prisma.instituicao.findFirst({
      where: { nome: { equals: texto, mode: "insensitive" } },
      select: campos,
    });
    return (
      porNome ??
      this.prisma.instituicao.findFirst({
        where: { sigla: { equals: texto, mode: "insensitive" } },
        select: campos,
      })
    );
  }
}
