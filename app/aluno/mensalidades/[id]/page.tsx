import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { ResumoMensalidade, TabelaDiarias } from "@/components/mensalidades/detalhe-mensalidade";
import { StatusMensalidadeBadge } from "@/components/mensalidades/status-mensalidade";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { formatarCompetencia } from "@/lib/datas";
import { ErroNaoEncontrado } from "@/server/comum/erros";
import { mensalidadeService, type MensalidadeDetalheDTO } from "@/server/mensalidades";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Mensalidade" };

export default async function MinhaMensalidade({ params }: PageProps<"/aluno/mensalidades/[id]">) {
  const usuario = await exigirPerfil(PerfilUsuario.ALUNO);
  const { id } = await params;
  let m: MensalidadeDetalheDTO;
  try {
    // Passa o alunoId: a mensalidade de outro aluno responde 404, não 403 —
    // nem a existência dela é revelada.
    m = await mensalidadeService.detalhar(id, usuario.alunoId!);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }

  return (
    <>
      <CabecalhoPagina
        titulo={`Mensalidade de ${formatarCompetencia(m.competencia)}`}
        acoes={<StatusMensalidadeBadge status={m.status} />}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <TabelaDiarias m={m} />
        <div className="space-y-4">
          <ResumoMensalidade m={m} />
          <Link href="/aluno/mensalidades" className="block text-sm text-muted-foreground hover:underline">
            ← Mensalidades
          </Link>
        </div>
      </div>
    </>
  );
}
