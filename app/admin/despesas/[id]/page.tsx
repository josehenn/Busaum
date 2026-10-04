import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { dataIso, hojeLocal } from "@/lib/datas";
import { ErroNaoEncontrado } from "@/server/comum/erros";
import { despesaService, type DespesaDTO } from "@/server/despesas";
import { veiculoService } from "@/server/veiculos";
import { FormularioDespesa } from "../_componentes/formulario-despesa";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Editar despesa" };

export default async function EditarDespesa({ params }: PageProps<"/admin/despesas/[id]">) {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const { id } = await params;
  let despesa: DespesaDTO;
  try {
    despesa = await despesaService.buscar(id);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }

  return (
    <>
      <CabecalhoPagina titulo="Editar despesa" descricao={despesa.descricao} />
      <FormularioDespesa
        despesa={despesa}
        veiculos={await veiculoService.listar()}
        hoje={dataIso(hojeLocal())}
      />
    </>
  );
}
