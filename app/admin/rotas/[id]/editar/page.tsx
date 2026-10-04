import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusVeiculo } from "@/lib/generated/prisma/enums";
import { pontoService } from "@/server/pontos";
import { veiculoService } from "@/server/veiculos";
import { FormularioRota } from "../../_componentes/formulario-rota";
import { carregarRota } from "../carregar-rota";

export const metadata: Metadata = { title: "Editar rota" };

export default async function EditarRota({ params }: PageProps<"/admin/rotas/[id]/editar">) {
  const { id } = await params;
  const [rota, veiculos, pontos] = await Promise.all([
    carregarRota(id),
    veiculoService.listar(),
    pontoService.listarAtivos(),
  ]);

  return (
    <>
      <CabecalhoPagina titulo={`Editar ${rota.nome}`} />
      <FormularioRota
        rota={rota}
        // O veículo atual aparece mesmo se não estiver mais ativo, para o select não ficar vazio.
        veiculos={veiculos.filter((v) => v.status === StatusVeiculo.ATIVO || v.id === rota.veiculo.id)}
        pontos={pontos}
      />
    </>
  );
}
