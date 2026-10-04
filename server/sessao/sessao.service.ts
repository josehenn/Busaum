// Camada de acesso (DAL): o único lugar que lê a sessão. Layouts, páginas,
// Route Handlers e services recebem um UsuarioSessao e não sabem que por baixo
// está o Better Auth (server/auth/auth.ts).
//
// Defesa em camadas:
//   1. proxy.ts — sem cookie de sessão, nem chega na página (checagem otimista);
//   2. exigirPerfil — em todo layout E em toda página das áreas logadas (layouts
//      não rodam de novo na navegação do cliente, então só o layout não basta);
//   3. exigirPerfilNaApi — em todo Route Handler: a API pode ser chamada direto;
//   4. services — o aluno vem da sessão, nunca do corpo da requisição.
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { definirPrimeiraSenhaSchema } from "@/lib/esquemas/senha";
import { auth } from "@/server/auth/auth";
import { definirPrimeiraSenha } from "@/server/auth/contas";
import { hashSenha } from "@/server/auth/credenciais";
import { ErroDeAcesso, ErroNaoAutenticado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  /** Senha provisória: só pode trocar a senha até escolher a dele. */
  trocarSenha: boolean;
  /** Preenchido quando o perfil é ALUNO. */
  alunoId: string | null;
  /** Sessão desta requisição (para manter só ela ao trocar a senha). */
  sessaoId: string;
};

export const ROTA_TROCAR_SENHA = "/conta/senha";

export function areaDoPerfil(perfil: PerfilUsuario) {
  return perfil === PerfilUsuario.ADMIN ? "/admin" : "/aluno";
}

/**
 * Sessão da requisição atual, validada no banco (token existe e não expirou).
 * `cache` faz layout + página + componentes dividirem uma única consulta.
 */
export const obterUsuarioAtual = cache(async (): Promise<UsuarioSessao | null> => {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return null;

  const { user } = sessao;
  // Desativar já apaga as sessões; isto cobre a corrida com uma requisição em voo.
  if (user.ativo === false) return null;
  const aluno =
    user.perfil === PerfilUsuario.ALUNO
      ? await prisma.aluno.findUnique({ where: { usuarioId: user.id }, select: { id: true } })
      : null;

  return {
    id: user.id,
    nome: user.name,
    email: user.email,
    perfil: user.perfil as PerfilUsuario,
    trocarSenha: Boolean(user.trocarSenha),
    alunoId: aluno?.id ?? null,
    sessaoId: sessao.session.id,
  };
});

/**
 * Primeira senha de quem entrou com a provisória. Só vale nesse estado: quem já
 * tem a própria senha troca pelo /api/auth/change-password, informando a atual.
 */
export async function definirPrimeiraSenhaDoUsuario(entrada: unknown) {
  const usuario = await obterUsuarioAtual();
  if (!usuario) throw new ErroNaoAutenticado("Entre no sistema para continuar.");
  if (!usuario.trocarSenha) {
    throw new ErroDeAcesso("Sua senha já foi criada. Para trocá-la, informe a senha atual.");
  }
  const { novaSenha } = validar(definirPrimeiraSenhaSchema, entrada);
  await definirPrimeiraSenha(prisma, usuario.id, await hashSenha(novaSenha), usuario.sessaoId);
  return { destino: areaDoPerfil(usuario.perfil) };
}

/**
 * Para layouts e páginas. Sem sessão → /login; com senha provisória → troca de
 * senha; perfil errado → a área do próprio perfil.
 */
export async function exigirPerfil(perfil: PerfilUsuario): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");
  if (usuario.trocarSenha) redirect(ROTA_TROCAR_SENHA);
  if (usuario.perfil !== perfil) redirect(areaDoPerfil(usuario.perfil));
  return usuario;
}

/** Qualquer perfil logado (troca de senha). Não barra a senha provisória. */
export async function exigirSessao(): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");
  return usuario;
}

/**
 * Versão para Route Handlers: em vez de redirecionar, lança 401 (sem sessão) ou
 * 403 (perfil errado / senha provisória ainda não trocada).
 */
export async function exigirPerfilNaApi(perfil?: PerfilUsuario): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) throw new ErroNaoAutenticado("Entre no sistema para continuar.");
  if (usuario.trocarSenha) throw new ErroDeAcesso("Troque sua senha provisória antes de continuar.");
  if (perfil && usuario.perfil !== perfil) {
    throw new ErroDeAcesso("Você não tem permissão para esta operação.");
  }
  return usuario;
}
