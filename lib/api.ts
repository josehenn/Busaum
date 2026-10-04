// Cliente da API para os formulários (Client Components).

/** Corpo de toda resposta de erro da API (ver server/comum/http.ts). */
export type RespostaDeErro = {
  erro: string;
  campos?: Record<string, string[]>;
};

export type ResultadoApi<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string; campos: Record<string, string[]> };

export async function enviarJson<T>(
  url: string,
  metodo: "POST" | "PATCH" | "PUT" | "DELETE",
  corpo?: unknown,
): Promise<ResultadoApi<T>> {
  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    const json = await resposta.json().catch(() => null);

    if (resposta.ok) return { ok: true, dados: json as T };

    const erro = json as RespostaDeErro | null;
    return {
      ok: false,
      erro: erro?.erro ?? `Erro ${resposta.status}.`,
      campos: erro?.campos ?? {},
    };
  } catch {
    return { ok: false, erro: "Sem conexão com o servidor.", campos: {} };
  }
}
