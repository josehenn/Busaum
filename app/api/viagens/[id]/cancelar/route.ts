import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";
import { viagemService } from "@/server/viagens";

/** POST { motivo } — cancela a viagem inteira; a diária do dia fica isenta para todos. */
export const POST = manipulador(async (request, ctx: RouteContext<"/api/viagens/[id]/cancelar">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  await viagemService.cancelar(id, await lerJson(request));
  return NextResponse.json({ ok: true });
});
