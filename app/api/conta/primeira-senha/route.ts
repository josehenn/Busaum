import { NextResponse } from "next/server";
import { lerJson, manipulador } from "@/server/comum/http";
import { definirPrimeiraSenhaDoUsuario } from "@/server/sessao/sessao.service";

/**
 * POST { novaSenha, confirmacao } — só para quem está com a senha provisória.
 * Não pede a senha atual: a sessão foi aberta com ela agora há pouco.
 */
export const POST = manipulador(async (request) => {
  return NextResponse.json(await definirPrimeiraSenhaDoUsuario(await lerJson(request)));
});
