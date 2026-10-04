import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { FormularioVeiculo } from "../_componentes/formulario-veiculo";

export const metadata: Metadata = { title: "Novo veículo" };

export default function NovoVeiculo() {
  return (
    <>
      <CabecalhoPagina titulo="Novo veículo" />
      <FormularioVeiculo />
    </>
  );
}
