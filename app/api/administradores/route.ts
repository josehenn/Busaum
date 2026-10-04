import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { administradorService } from "@/server/administradores";
import { lerJson, manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

export const GET = manipulador(async () => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  return NextResponse.json(await administradorService.listar());
});

/** POST { nome, email } → { administrador, senhaProvisoria } (a senha só aparece aqui). */
export const POST = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const criado = await administradorService.criar(await lerJson(request));
  return NextResponse.json(criado, { status: 201, headers: { "Cache-Control": "no-store" } });
});
