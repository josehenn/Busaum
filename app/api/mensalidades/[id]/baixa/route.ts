import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { manipulador } from "@/server/comum/http";
import { mensalidadeService } from "@/server/mensalidades";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** POST — baixa manual do pagamento, via PaymentGateway. */
export const POST = manipulador(async (_request, ctx: RouteContext<"/api/mensalidades/[id]/baixa">) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const { id } = await ctx.params;
  await mensalidadeService.darBaixa(id, usuario.id);
  return NextResponse.json({ mensagem: "Pagamento registrado." });
});
