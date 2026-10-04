import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { instituicaoService } from "@/server/instituicoes";
import { FormularioPonto } from "../_componentes/formulario-ponto";

export const metadata: Metadata = { title: "Novo ponto" };

export default async function NovoPonto() {
  return (
    <>
      <CabecalhoPagina titulo="Novo ponto" />
      <FormularioPonto instituicoes={await instituicaoService.listar()} />
    </>
  );
}
