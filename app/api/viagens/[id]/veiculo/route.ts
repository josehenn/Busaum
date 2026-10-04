import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";
import { viagemService } from "@/server/viagens";

/** POST { veiculoId } — troca o veículo só desta viagem. */
export const POST = manipulador(async (request, ctx: RouteContext<"/api/viagens/[id]/veiculo">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  await viagemService.trocarVeiculo(id, await lerJson(request));
  return NextResponse.json({ ok: true });
});
