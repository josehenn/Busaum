import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { FormularioVeiculo } from "../_componentes/formulario-veiculo";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Novo veículo" };

export default async function NovoVeiculo() {
  await exigirPerfil(PerfilUsuario.ADMIN);
  return (
    <>
      <CabecalhoPagina titulo="Novo veículo" />
      <FormularioVeiculo />
    </>
  );
}
