import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { administradorService } from "@/server/administradores";
import { lerJson, manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** PATCH { ativo } — desativar encerra as sessões; não dá para desativar a si mesmo nem o último. */
export const PATCH = manipulador(async (request, ctx: RouteContext<"/api/administradores/[id]">) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await administradorService.definirAtivo(id, await lerJson(request), usuario.id));
});
