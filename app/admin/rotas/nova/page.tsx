import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusVeiculo } from "@/lib/generated/prisma/enums";
import { pontoService } from "@/server/pontos";
import { veiculoService } from "@/server/veiculos";
import { FormularioRota } from "../_componentes/formulario-rota";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Nova rota" };

export default async function NovaRota() {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const [veiculos, pontos] = await Promise.all([veiculoService.listar(), pontoService.listarAtivos()]);

  return (
    <>
      <CabecalhoPagina titulo="Nova rota" />
      <FormularioRota
        veiculos={veiculos.filter((v) => v.status === StatusVeiculo.ATIVO)}
        pontos={pontos}
      />
    </>
  );
}
