import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";
import { veiculoService } from "@/server/veiculos";

export const GET = manipulador(async (_request, ctx: RouteContext<"/api/veiculos/[id]">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await veiculoService.buscar(id));
});

// Não existe DELETE: veículo tem histórico de viagens e despesas. Para tirar de
// circulação, PATCH { "status": "INATIVO" }.
export const PATCH = manipulador(async (request, ctx: RouteContext<"/api/veiculos/[id]">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await veiculoService.atualizar(id, await lerJson(request)));
});
