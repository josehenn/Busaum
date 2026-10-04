import { notFound } from "next/navigation";
import { ErroNaoEncontrado } from "@/server/comum/erros";
import { rotaService, type RotaDTO } from "@/server/rotas";

/** Busca a rota ou responde 404 — usado pelas páginas de /admin/rotas/[id]. */
export async function carregarRota(id: string): Promise<RotaDTO> {
  try {
    return await rotaService.buscar(id);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }
}
