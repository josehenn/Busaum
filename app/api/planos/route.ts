import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { lerJson, manipulador } from "@/server/comum/http";
import { planoService } from "@/server/planos";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/**
 * Contrata o transporte de um aluno numa rota. Se ele já tem plano nela, é uma
 * troca: o atual é encerrado agora e o novo começa no mesmo instante.
 */
export const POST = manipulador(async (request) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const plano = await planoService.contratar(await lerJson(request), usuario.id);
  return NextResponse.json(plano, { status: 201 });
});
