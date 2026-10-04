// Route Handler fino: autoriza, lê o corpo, chama o service e serializa.
// Nenhuma regra de negócio mora aqui.
import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";
import { veiculoService } from "@/server/veiculos";

export const GET = manipulador(async () => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  return NextResponse.json(await veiculoService.listar());
});

export const POST = manipulador(async (request) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const veiculo = await veiculoService.criar(await lerJson(request), usuario.id);
  return NextResponse.json(veiculo, { status: 201 });
});
