import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { declaracaoService } from "@/server/declaracoes";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/**
 * PUT { usaIda, usaVolta } — o que o aluno logado vai usar desta viagem.
 * O aluno vem da sessão, nunca do corpo: ninguém declara pelo outro.
 */
export const PUT = manipulador(async (request, ctx: RouteContext<"/api/aluno/viagens/[id]">) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ALUNO);
  const { id } = await ctx.params;
  await declaracaoService.declarar(usuario.alunoId!, id, await lerJson(request));
  return NextResponse.json({ ok: true });
});
