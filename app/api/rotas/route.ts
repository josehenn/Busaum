import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { rotaService } from "@/server/rotas";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

export const GET = manipulador(async () => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  return NextResponse.json(await rotaService.listar());
});

export const POST = manipulador(async (request) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const rota = await rotaService.criar(await lerJson(request), usuario.id);
  return NextResponse.json(rota, { status: 201 });
});
