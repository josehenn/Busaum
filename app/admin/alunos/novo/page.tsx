import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { hojeLocal } from "@/lib/datas";
import { instituicaoService } from "@/server/instituicoes";
import { FormularioAluno } from "../_componentes/formulario-aluno";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Novo aluno" };

export default async function NovoAluno() {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const instituicoes = await instituicaoService.listar();

  return (
    <>
      <CabecalhoPagina
        titulo="Novo aluno"
        descricao="O cadastro cria também o acesso do aluno ao sistema, pelo e-mail informado."
      />
      <FormularioAluno instituicoes={instituicoes} hoje={hojeLocal().toISOString().slice(0, 10)} />
    </>
  );
}
