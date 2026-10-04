import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusAluno } from "@/lib/generated/prisma/enums";
import { alunoService } from "@/server/alunos";
import { planoService } from "@/server/planos";
import { rotaService } from "@/server/rotas";
import { carregarRota } from "../../carregar-rota";
import { FormularioPlano } from "./formulario-plano";

export const metadata: Metadata = { title: "Contratar aluno" };

export default async function NovoPlano({ params, searchParams }: PageProps<"/admin/rotas/[id]/planos/novo">) {
  const { id } = await params;
  const { aluno: alunoParam } = await searchParams;
  const alunoId = typeof alunoParam === "string" ? alunoParam : undefined;

  const rota = await carregarRota(id);
  const [ocupacao, alunos, planoAtual] = await Promise.all([
    rotaService.ocupacao(id),
    alunoService.listar({ status: StatusAluno.ATIVO }),
    alunoId ? planoService.buscarAberto(alunoId, id) : null,
  ]);

  return (
    <>
      <CabecalhoPagina
        titulo={planoAtual ? `Trocar plano de ${planoAtual.aluno.nome}` : "Contratar aluno"}
        descricao={
          planoAtual
            ? "O plano atual é encerrado agora e o novo vale a partir deste instante. Nada que já passou é recalculado."
            : rota.nome
        }
      />
      <FormularioPlano
        rota={rota}
        ocupacao={ocupacao}
        alunos={alunos.map((a) => ({ id: a.id, nome: a.nome, instituicaoId: a.instituicao.id }))}
        planoAtual={planoAtual}
      />
    </>
  );
}
