import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import type { FiltroAlunos } from "@/lib/esquemas/aluno";
import { ErroDeConflito } from "@/server/comum/erros";
import type {
  Aluno,
  DadosAtualizarAluno,
  DadosCriarAluno,
  IAlunoRepository,
} from "./aluno.repository";

const incluir = {
  usuario: { select: { id: true, nome: true, email: true } },
  instituicao: { select: { id: true, nome: true, sigla: true } },
} satisfies Prisma.AlunoInclude;

export class PrismaAlunoRepository implements IAlunoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listar({ busca, status }: FiltroAlunos): Promise<Aluno[]> {
    return this.prisma.aluno.findMany({
      where: {
        status,
        ...(busca && {
          OR: [
            { usuario: { nome: { contains: busca, mode: "insensitive" } } },
            { usuario: { email: { contains: busca, mode: "insensitive" } } },
            { matricula: { contains: busca, mode: "insensitive" } },
          ],
        }),
      },
      include: incluir,
      orderBy: [{ status: "asc" }, { usuario: { nome: "asc" } }],
    });
  }

  buscarPorId(id: string): Promise<Aluno | null> {
    return this.prisma.aluno.findUnique({ where: { id }, include: incluir });
  }

  async idDoUsuarioComEmail(email: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email }, select: { id: true } });
    return usuario?.id ?? null;
  }

  async idDoAlunoComCpf(cpf: string) {
    const aluno = await this.prisma.aluno.findUnique({ where: { cpf }, select: { id: true } });
    return aluno?.id ?? null;
  }

  async idDoAlunoComMatricula(instituicaoId: string, matricula: string) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { instituicaoId, matricula: { equals: matricula, mode: "insensitive" } },
      select: { id: true },
    });
    return aluno?.id ?? null;
  }

  async criar({ nome, email, instituicaoId, ...dados }: DadosCriarAluno) {
    try {
      // Escrita aninhada: o Prisma cria usuário e aluno na mesma transação.
      return await this.prisma.aluno.create({
        data: {
          ...dados,
          instituicao: { connect: { id: instituicaoId } },
          usuario: { create: { nome, email, perfil: PerfilUsuario.ALUNO } },
        },
        include: incluir,
      });
    } catch (erro) {
      throw traduzirDuplicidade(erro);
    }
  }

  async atualizar(
    id: string,
    { nome, email, instituicaoId, ...dados }: DadosAtualizarAluno,
    opcoes: { encerrarPlanosEm?: Date } = {},
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (opcoes.encerrarPlanosEm) {
          await tx.planoRota.updateMany({
            where: { alunoId: id, vigenteAte: null },
            data: { vigenteAte: opcoes.encerrarPlanosEm },
          });
        }
        return tx.aluno.update({
          where: { id },
          data: {
            ...dados,
            ...(instituicaoId && { instituicao: { connect: { id: instituicaoId } } }),
            ...((nome || email) && { usuario: { update: { nome, email } } }),
          },
          include: incluir,
        });
      });
    } catch (erro) {
      throw traduzirDuplicidade(erro);
    }
  }
}

/**
 * Rede de segurança para corrida entre duas requisições: o service confere as
 * unicidades antes, mas o @unique do banco é quem garante de fato.
 */
function traduzirDuplicidade(erro: unknown) {
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
    return new ErroDeConflito("E-mail ou CPF já cadastrado por outra pessoa.");
  }
  return erro;
}
