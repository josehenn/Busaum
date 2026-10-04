import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { rotaService } from "@/server/rotas";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

type Ctx = RouteContext<"/api/rotas/[id]">;

export const GET = manipulador(async (_request, ctx: Ctx) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await rotaService.buscar(id));
});

// Sem DELETE: a rota tem histórico de viagens e cobranças. PATCH { "ativa": false }.
export const PATCH = manipulador(async (request, ctx: Ctx) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await rotaService.atualizar(id, await lerJson(request)));
});
