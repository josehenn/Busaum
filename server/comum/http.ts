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

/**
 * Envolve um Route Handler com a tradução de erros: o corpo da função cuida só
 * do caminho feliz.
 *
 *   export const POST = manipulador(async (request) => { ... });
 */
export function manipulador<C>(fn: (request: Request, ctx: C) => Promise<Response>) {
  return async (request: Request, ctx: C) => {
    try {
      return await fn(request, ctx);
    } catch (erro) {
      return responderErro(erro);
    }
  };
}

/**
 * Lê um multipart/form-data: os campos de texto viram um objeto (para o Zod) e
 * o arquivo do campo `campoArquivo` vem à parte.
 */
export async function lerFormulario(request: Request, campoArquivo: string) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ErroDeValidacao("Envie o formulário como multipart/form-data.");
  }
  const campos: Record<string, string> = {};
  for (const [chave, valor] of form) {
    if (typeof valor === "string") campos[chave] = valor;
  }
  const arquivo = form.get(campoArquivo);
  return { campos, arquivo: arquivo instanceof File && arquivo.size > 0 ? arquivo : null };
}

export async function lerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ErroDeValidacao("O corpo da requisição não é um JSON válido.");
  }
}
