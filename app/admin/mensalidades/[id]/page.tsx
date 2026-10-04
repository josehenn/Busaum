import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoAcao } from "@/components/formulario/botao-acao";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { ResumoMensalidade, TabelaDiarias } from "@/components/mensalidades/detalhe-mensalidade";
import { StatusMensalidadeBadge } from "@/components/mensalidades/status-mensalidade";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusMensalidade } from "@/lib/generated/prisma/enums";
import { formatarCompetencia } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { ErroNaoEncontrado } from "@/server/comum/erros";
import { mensalidadeService, type MensalidadeDetalheDTO } from "@/server/mensalidades";
import { FormularioAjuste } from "../_componentes/formulario-ajuste";

export const metadata: Metadata = { title: "Mensalidade" };

export default async function DetalheMensalidade({ params }: PageProps<"/admin/mensalidades/[id]">) {
  const { id } = await params;
  let m: MensalidadeDetalheDTO;
  try {
    m = await mensalidadeService.detalhar(id);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }
  const editavel = m.status === StatusMensalidade.ABERTA || m.status === StatusMensalidade.VENCIDA;

  return (
    <>
      <CabecalhoPagina
        titulo={m.aluno.nome}
        descricao={`Mensalidade de ${formatarCompetencia(m.competencia)}`}
        acoes={
          <>
            <StatusMensalidadeBadge status={m.status} />
            {editavel && (
              <BotaoAcao
                url={`/api/mensalidades/${id}/baixa`}
                variante="default"
                tamanho="default"
                mensagemSucesso="Pagamento registrado."
                confirmacao={{
                  titulo: `Registrar pagamento de ${formatarReais(m.valor)}?`,
                  descricao: "A mensalidade passa para paga e não pode mais ser alterada.",
                  rotuloConfirmar: "Registrar pagamento",
                }}
              >
                Dar baixa
              </BotaoAcao>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <TabelaDiarias m={m} />
        <div className="space-y-4">
          <ResumoMensalidade m={m} />
          {editavel && (
            <Card>
              <CardHeader>
                <CardTitle>Ajuste manual</CardTitle>
                <CardDescription>
                  O subtotal vem das diárias e não muda. O ajuste soma (ou desconta) e fica assinado por você.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormularioAjuste mensalidadeId={id} ajuste={m.ajuste} motivo={m.motivoAjuste} />
              </CardContent>
            </Card>
          )}
          <Link href="/admin/mensalidades" className="block text-sm text-muted-foreground hover:underline">
            ← Mensalidades
          </Link>
        </div>
      </div>
    </>
  );
}
