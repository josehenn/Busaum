import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { manipulador } from "@/server/comum/http";
import { conviteService } from "@/server/convites";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** DELETE — revoga (o registro fica, para o histórico). */
export const DELETE = manipulador(async (_request, ctx: RouteContext<"/api/convites/[id]">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await conviteService.revogar(id));
});
