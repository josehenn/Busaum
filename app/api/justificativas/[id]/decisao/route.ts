import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { justificativaService } from "@/server/justificativas";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** POST { decisao: "APROVAR" | "RECUSAR", observacao? } — registra quem decidiu e quando. */
export const POST = manipulador(async (request, ctx: RouteContext<"/api/justificativas/[id]/decisao">) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await justificativaService.decidir(id, await lerJson(request), usuario.id));
});
