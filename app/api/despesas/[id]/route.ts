import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerFormulario, manipulador } from "@/server/comum/http";
import { despesaService } from "@/server/despesas";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

type Ctx = RouteContext<"/api/despesas/[id]">;

export const GET = manipulador(async (_request, ctx: Ctx) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  return NextResponse.json(await despesaService.buscar(id));
});

/** PATCH multipart. Sem arquivo novo, o comprovante atual é mantido. */
export const PATCH = manipulador(async (request, ctx: Ctx) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  const { campos, arquivo } = await lerFormulario(request, "comprovante");
  return NextResponse.json(await despesaService.atualizar(id, campos, arquivo));
});
