import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { Aluno, DadosCriarAluno } from "@/server/alunos/aluno.repository";
import { criarAlunoComLogin, traduzirDuplicidade } from "@/server/alunos/prisma-aluno.repository";
import type { Convite, IConviteRepository } from "./convite.repository";

const campos = {
  id: true,
  email: true,
  expiraEm: true,
  usadoEm: true,
  revogadoEm: true,
  criadoEm: true,
  alunoId: true,
} as const;

type Linha = {
  id: string;
  email: string | null;
  expiraEm: Date;
  usadoEm: Date | null;
  revogadoEm: Date | null;
  criadoEm: Date;
  alunoId: string | null;
};

export class PrismaConviteRepository implements IConviteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: { tokenHash: string; email: string | null; expiraEm: Date; criadoPor: string }) {
    const linha = await this.prisma.convite.create({ data: dados, select: campos });
    return { ...semAlunoId(linha), aluno: null };
  }

  async listar(): Promise<Convite[]> {
    const linhas = await this.prisma.convite.findMany({ select: campos, orderBy: { criadoEm: "desc" }, take: 100 });
    return this.comAlunos(linhas);
  }

  async buscarPorId(id: string) {
    const linha = await this.prisma.convite.findUnique({ where: { id }, select: campos });
    return linha ? (await this.comAlunos([linha]))[0] : null;
  }

  async buscarPorTokenHash(tokenHash: string) {
    const linha = await this.prisma.convite.findUnique({
      where: { tokenHash },
      select: { ...campos, criadoPor: true },
    });
    return linha ? { ...semAlunoId(linha), criadoPor: linha.criadoPor, aluno: null } : null;
  }

  async revogar(id: string, em: Date) {
    await this.prisma.convite.updateMany({
      where: { id, usadoEm: null, revogadoEm: null },
      data: { revogadoEm: em },
    });
  }

  async usarECriarAluno(conviteId: string, agora: Date, dados: DadosCriarAluno): Promise<Aluno | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // O filtro é a trava: se outro cadastro marcou primeiro, count = 0.
        const { count } = await tx.convite.updateMany({
          where: { id: conviteId, usadoEm: null, revogadoEm: null, expiraEm: { gt: agora } },
          data: { usadoEm: agora },
        });
        if (count !== 1) return null;

        const aluno = await criarAlunoComLogin(tx, dados);
        await tx.convite.update({ where: { id: conviteId }, data: { alunoId: aluno.id } });
        return aluno;
      });
    } catch (erro) {
      throw traduzirDuplicidade(erro);
    }
  }

  private async comAlunos(linhas: Linha[]): Promise<Convite[]> {
    const ids = linhas.map((l) => l.alunoId).filter((id): id is string => id !== null);
    const alunos = ids.length
      ? await this.prisma.aluno.findMany({
          where: { id: { in: ids } },
          select: { id: true, usuario: { select: { nome: true } } },
        })
      : [];
    const porId = new Map(alunos.map((a) => [a.id, { id: a.id, nome: a.usuario.nome }]));
    return linhas.map((l) => ({ ...semAlunoId(l), aluno: l.alunoId ? (porId.get(l.alunoId) ?? null) : null }));
  }
}

function semAlunoId(linha: Linha): Omit<Convite, "aluno"> {
  return {
    id: linha.id,
    email: linha.email,
    expiraEm: linha.expiraEm,
    usadoEm: linha.usadoEm,
    revogadoEm: linha.revogadoEm,
    criadoEm: linha.criadoEm,
  };
}
