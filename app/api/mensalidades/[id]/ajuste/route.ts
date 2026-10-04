import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { mensalidadeService } from "@/server/mensalidades";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** POST { ajuste: "-24,00" | "", motivo } — ajuste assinado (quem e quando ficam gravados). */
export const POST = manipulador(async (request, ctx: RouteContext<"/api/mensalidades/[id]/ajuste">) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  await mensalidadeService.ajustar(id, await lerJson(request), usuario.id);
  return NextResponse.json({ ok: true });
});
