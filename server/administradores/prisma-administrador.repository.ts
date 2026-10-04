import type { PrismaClient } from "@/lib/generated/prisma/client";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { criarUsuarioComSenha, definirUsuarioAtivo, redefinirSenhaDoUsuario } from "@/server/auth/contas";
import type { Administrador, IAdministradorRepository } from "./administrador.repository";

const campos = { id: true, nome: true, email: true, ativo: true, trocarSenha: true, criadoEm: true } as const;
const deAdmin = { perfil: PerfilUsuario.ADMIN } as const;

export class PrismaAdministradorRepository implements IAdministradorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listar(): Promise<Administrador[]> {
    return this.prisma.usuario.findMany({
      where: deAdmin,
      select: campos,
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });
  }

  buscarPorId(id: string) {
    return this.prisma.usuario.findFirst({ where: { id, ...deAdmin }, select: campos });
  }

  async emailEmUso(email: string) {
    return (await this.prisma.usuario.count({ where: { email } })) > 0;
  }

  contarAtivos() {
    return this.prisma.usuario.count({ where: { ...deAdmin, ativo: true } });
  }

  async criar(dados: { nome: string; email: string; senhaHash: string }) {
    const { id } = await this.prisma.$transaction((tx) =>
      criarUsuarioComSenha(tx, { ...dados, perfil: PerfilUsuario.ADMIN, trocarSenha: true }),
    );
    return (await this.buscarPorId(id))!;
  }

  redefinirSenha(id: string, senhaHash: string) {
    return redefinirSenhaDoUsuario(this.prisma, id, senhaHash);
  }

  async definirAtivo(id: string, ativo: boolean) {
    await this.prisma.$transaction((tx) => definirUsuarioAtivo(tx, id, ativo));
    return (await this.buscarPorId(id))!;
  }
}
