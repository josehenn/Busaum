import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { dataIso, hojeLocal } from "@/lib/datas";
import { veiculoService } from "@/server/veiculos";
import { FormularioDespesa } from "../_componentes/formulario-despesa";

export const metadata: Metadata = { title: "Nova despesa" };

export default async function NovaDespesa() {
  return (
    <>
      <CabecalhoPagina titulo="Nova despesa" />
      <FormularioDespesa veiculos={await veiculoService.listar()} hoje={dataIso(hojeLocal())} />
    </>
  );
}
