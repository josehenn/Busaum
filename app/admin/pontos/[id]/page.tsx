import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { ErroNaoEncontrado } from "@/server/comum/erros";
import { instituicaoService } from "@/server/instituicoes";
import { pontoService, type PontoDTO } from "@/server/pontos";
import { FormularioPonto } from "../_componentes/formulario-ponto";

export const metadata: Metadata = { title: "Editar ponto" };

export default async function EditarPonto({ params }: PageProps<"/admin/pontos/[id]">) {
  const { id } = await params;

  let ponto: PontoDTO;
  try {
    ponto = await pontoService.buscar(id);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }

  const rotas = ponto.rotas.map((r) => r.nome).join(", ");
  return (
    <>
      <CabecalhoPagina
        titulo={ponto.descricao}
        descricao={rotas ? `No trajeto de: ${rotas}` : "Ainda não está em nenhuma rota."}
      />
      <FormularioPonto ponto={ponto} instituicoes={await instituicaoService.listar()} />
    </>
  );
}
