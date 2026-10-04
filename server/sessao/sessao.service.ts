// Sessão de demonstração: ocupa o lugar da autenticação, que ficou fora desta
// entrega. O cookie guarda só o id do usuário escolhido na tela de entrada — não
// há senha, então isto NÃO é controle de acesso de verdade.
//
// Quando o Better Auth entrar, só este arquivo muda: layouts, telas e services
// continuam recebendo um UsuarioSessao.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { ErroDeAcesso } from "@/server/comum/erros";

const COOKIE_SESSAO = "busaum_usuario";
const SETE_DIAS_S = 7 * 24 * 60 * 60;

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  /** Preenchido quando o perfil é ALUNO. */
  alunoId: string | null;
};

export async function obterUsuarioAtual(): Promise<UsuarioSessao | null> {
  const id = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!id) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, perfil: true, aluno: { select: { id: true } } },
  });
  if (!usuario) return null;

  const { aluno, ...dados } = usuario;
  return { ...dados, alunoId: aluno?.id ?? null };
}

/** Usado nos layouts de cada área: sem sessão ou com o perfil errado, volta para /login. */
export async function exigirPerfil(perfil: PerfilUsuario): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario || usuario.perfil !== perfil) redirect("/login");
  return usuario;
}

/**
 * Versão para Route Handlers: em vez de redirecionar, lança ErroDeAcesso (403).
 * A checagem se repete aqui, e não só no layout, porque a API pode ser chamada
 * direto, sem passar por nenhuma página.
 */
export async function exigirPerfilNaApi(perfil: PerfilUsuario): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario || usuario.perfil !== perfil) {
    throw new ErroDeAcesso("Você não tem permissão para esta operação.");
  }
  return usuario;
}

export async function listarUsuariosParaEntrada() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      aluno: { select: { curso: true, status: true, instituicao: { select: { sigla: true } } } },
    },
    orderBy: [{ perfil: "asc" }, { nome: "asc" }],
  });
}

/** Abre a sessão e devolve o perfil, ou null se o usuário não existe. */
export async function entrar(usuarioId: string): Promise<PerfilUsuario | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { perfil: true },
  });
  if (!usuario) return null;

  (await cookies()).set(COOKIE_SESSAO, usuarioId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SETE_DIAS_S,
  });
  return usuario.perfil;
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
}
