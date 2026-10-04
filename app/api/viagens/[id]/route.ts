import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";
import { viagemService } from "@/server/viagens";

/** Passageiros, ausentes e movimento em cada ponto. */
export const GET = manipulador(async (_request, ctx: RouteContext<"/api/viagens/[id]">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await viagemService.detalhar(id));
});
