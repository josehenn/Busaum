// Escritas de conta de login feitas pelo próprio sistema (fora da API do Better
// Auth): criar usuário com senha, redefinir senha, desativar. Usadas pelos
// repositórios de alunos, administradores e convites, sempre em transação.
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import type { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { PROVEDOR_SENHA } from "./credenciais";

type Cliente = PrismaClient | Prisma.TransactionClient;

/** Usuário + conta de e-mail e senha (accountId = id do usuário, como o Better Auth espera). */
export async function criarUsuarioComSenha(
  tx: Prisma.TransactionClient,
  dados: { nome: string; email: string; perfil: PerfilUsuario; senhaHash: string; trocarSenha: boolean },
) {
  const { senhaHash, ...usuario } = dados;
  const criado = await tx.usuario.create({ data: usuario });
  await tx.conta.create({
    data: { usuarioId: criado.id, accountId: criado.id, providerId: PROVEDOR_SENHA, senha: senhaHash },
  });
  return criado;
}

/** Nova senha provisória: troca o hash, exige troca no próximo acesso e derruba as sessões. */
export async function redefinirSenhaDoUsuario(prisma: PrismaClient, usuarioId: string, senhaHash: string) {
  await prisma.$transaction([
    prisma.conta.updateMany({ where: { usuarioId, providerId: PROVEDOR_SENHA }, data: { senha: senhaHash } }),
    prisma.usuario.update({ where: { id: usuarioId }, data: { trocarSenha: true } }),
    prisma.sessao.deleteMany({ where: { usuarioId } }),
  ]);
}

/**
 * Primeira senha: grava o hash, libera o acesso (trocarSenha = false) e derruba
 * as outras sessões — quem mais conhecia a provisória perde o acesso. A sessão
 * atual continua, para a pessoa seguir logada.
 */
export async function definirPrimeiraSenha(
  prisma: PrismaClient,
  usuarioId: string,
  senhaHash: string,
  sessaoAtualId: string,
) {
  await prisma.$transaction([
    prisma.conta.updateMany({ where: { usuarioId, providerId: PROVEDOR_SENHA }, data: { senha: senhaHash } }),
    prisma.usuario.update({ where: { id: usuarioId }, data: { trocarSenha: false } }),
    prisma.sessao.deleteMany({ where: { usuarioId, id: { not: sessaoAtualId } } }),
  ]);
}

/** Desativar derruba as sessões na hora; reativar só libera o próximo login. */
export async function definirUsuarioAtivo(prisma: Cliente, usuarioId: string, ativo: boolean) {
  await prisma.usuario.update({ where: { id: usuarioId }, data: { ativo } });
  if (!ativo) await prisma.sessao.deleteMany({ where: { usuarioId } });
}
