import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { instituicaoService } from "@/server/instituicoes";
import { FormularioPonto } from "../_componentes/formulario-ponto";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Novo ponto" };

export default async function NovoPonto() {
  await exigirPerfil(PerfilUsuario.ADMIN);
  return (
    <>
      <CabecalhoPagina titulo="Novo ponto" />
      <FormularioPonto instituicoes={await instituicaoService.listar()} />
    </>
  );
}
