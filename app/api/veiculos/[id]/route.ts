import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, responderErro } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";
import { veiculoService } from "@/server/veiculos";

export async function GET(_request: Request, ctx: RouteContext<"/api/veiculos/[id]">) {
  try {
    await exigirPerfilNaApi(PerfilUsuario.ADMIN);
    const { id } = await ctx.params;
    return NextResponse.json(await veiculoService.buscar(id));
  } catch (erro) {
    return responderErro(erro);
  }
}

// Não existe DELETE: veículo tem histórico de viagens e despesas. Para tirar de
// circulação, PATCH { "status": "INATIVO" }.
export async function PATCH(request: Request, ctx: RouteContext<"/api/veiculos/[id]">) {
  try {
    await exigirPerfilNaApi(PerfilUsuario.ADMIN);
    const { id } = await ctx.params;
    return NextResponse.json(await veiculoService.atualizar(id, await lerJson(request)));
  } catch (erro) {
    return responderErro(erro);
  }
}
