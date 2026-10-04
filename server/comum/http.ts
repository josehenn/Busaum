// Tradução entre HTTP e a camada de domínio, usada pelos Route Handlers.
import { NextResponse } from "next/server";
import type { RespostaDeErro } from "@/lib/api";
import { ErroDeDominio, ErroDeValidacao } from "./erros";

export function responderErro(erro: unknown) {
  if (erro instanceof ErroDeDominio) {
    return NextResponse.json<RespostaDeErro>(
      { erro: erro.message, campos: erro.campos },
      { status: erro.status },
    );
  }
  console.error(erro);
  return NextResponse.json<RespostaDeErro>({ erro: "Erro interno. Tente novamente." }, { status: 500 });
}

export async function lerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ErroDeValidacao("O corpo da requisição não é um JSON válido.");
  }
}
