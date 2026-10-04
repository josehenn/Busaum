import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import type { FiltroAlunos } from "@/lib/esquemas/aluno";
import { PROVEDOR_SENHA } from "@/server/auth/credenciais";
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

  async criar(dados: DadosCriarAluno) {
    try {
      return await this.prisma.$transaction((tx) => criarAlunoComLogin(tx, dados));
    } catch (erro) {
      throw traduzirDuplicidade(erro);
    }
  }

  async redefinirSenha(usuarioId: string, senhaHash: string) {
    await this.prisma.$transaction([
      this.prisma.conta.updateMany({
        where: { usuarioId, providerId: PROVEDOR_SENHA },
        data: { senha: senhaHash },
      }),
      this.prisma.usuario.update({ where: { id: usuarioId }, data: { trocarSenha: true } }),
      // Derruba todas as sessões: quem estava logado com a senha antiga sai.
      this.prisma.sessao.deleteMany({ where: { usuarioId } }),
    ]);
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
 * Cria usuário (perfil ALUNO), conta de e-mail e senha e aluno. Recebe a
 * transação de quem chama: o convite usa a mesma função dentro da transação que
 * marca o convite como usado.
 */
export async function criarAlunoComLogin(
  tx: Prisma.TransactionClient,
  { nome, email, instituicaoId, senhaHash, trocarSenha, ...dados }: DadosCriarAluno,
) {
  const usuario = await tx.usuario.create({
    data: { nome, email, perfil: PerfilUsuario.ALUNO, trocarSenha },
  });
  // accountId = id do usuário: é como o Better Auth acha a conta de senha.
  await tx.conta.create({
    data: { usuarioId: usuario.id, accountId: usuario.id, providerId: PROVEDOR_SENHA, senha: senhaHash },
  });
  return tx.aluno.create({
    data: {
      ...dados,
      usuario: { connect: { id: usuario.id } },
      instituicao: { connect: { id: instituicaoId } },
    },
    include: incluir,
  });
}

/**
 * Rede de segurança para corrida entre duas requisições: o service confere as
 * unicidades antes, mas o @unique do banco é quem garante de fato.
 */
export function traduzirDuplicidade(erro: unknown) {
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
    return new ErroDeConflito("E-mail ou CPF já cadastrado por outra pessoa.");
  }
  return erro;
}
