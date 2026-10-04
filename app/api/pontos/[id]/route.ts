import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { pontoService } from "@/server/pontos";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

type Ctx = RouteContext<"/api/pontos/[id]">;

export const GET = manipulador(async (_request, ctx: Ctx) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await pontoService.buscar(id));
});

// Sem DELETE: planos e trajetos antigos apontam para o ponto. Para tirar de
// uso, PATCH { "ativo": false }.
export const PATCH = manipulador(async (request, ctx: Ctx) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await pontoService.atualizar(id, await lerJson(request)));
});
