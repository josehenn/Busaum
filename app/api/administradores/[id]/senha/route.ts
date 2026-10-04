import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { administradorService } from "@/server/administradores";
import { manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** POST — nova senha provisória (só nesta resposta) e sessões encerradas. */
export const POST = manipulador(async (_request, ctx: RouteContext<"/api/administradores/[id]/senha">) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await administradorService.redefinirSenha(id, usuario.id), {
    headers: { "Cache-Control": "no-store" },
  });
});
