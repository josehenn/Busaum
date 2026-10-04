import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { hojeLocal } from "@/lib/datas";
import { alunoService, type AlunoEdicaoDTO } from "@/server/alunos";
import { ErroNaoEncontrado } from "@/server/comum/erros";
import { instituicaoService } from "@/server/instituicoes";
import { BotaoRedefinirSenha } from "../_componentes/botao-redefinir-senha";
import { FormularioAluno } from "../_componentes/formulario-aluno";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Editar aluno" };

export default async function EditarAluno({ params }: PageProps<"/admin/alunos/[id]">) {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const { id } = await params;

  let aluno: AlunoEdicaoDTO;
  try {
    aluno = await alunoService.buscarParaEdicao(id);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }
  const instituicoes = await instituicaoService.listar();

  return (
    <>
      <CabecalhoPagina
        titulo={aluno.nome}
        descricao={`${aluno.curso} · ${aluno.instituicao.sigla ?? aluno.instituicao.nome}`}
        acoes={<BotaoRedefinirSenha alunoId={aluno.id} email={aluno.email} />}
      />
      <FormularioAluno
        aluno={aluno}
        instituicoes={instituicoes}
        hoje={hojeLocal().toISOString().slice(0, 10)}
      />
    </>
  );
}
