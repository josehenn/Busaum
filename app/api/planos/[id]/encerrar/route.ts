import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { manipulador } from "@/server/comum/http";
import { planoService } from "@/server/planos";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** Encerra a vigência agora. O histórico fica: dias já passados continuam cobrados. */
export const POST = manipulador(async (_request, ctx: RouteContext<"/api/planos/[id]/encerrar">) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await planoService.encerrar(id));
});
