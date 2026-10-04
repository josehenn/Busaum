import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { ErroNaoEncontrado } from "@/server/comum/erros";
import { veiculoService, type VeiculoDTO } from "@/server/veiculos";
import { FormularioVeiculo } from "../_componentes/formulario-veiculo";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Editar veículo" };

export default async function EditarVeiculo({ params }: PageProps<"/admin/veiculos/[id]">) {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const { id } = await params;

  let veiculo: VeiculoDTO;
  try {
    veiculo = await veiculoService.buscar(id);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }

  return (
    <>
      <CabecalhoPagina titulo={`Veículo ${veiculo.placa}`} descricao={veiculo.modelo} />
      <FormularioVeiculo veiculo={veiculo} />
    </>
  );
}
