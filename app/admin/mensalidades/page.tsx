import type { Metadata } from "next";
import Link from "next/link";
import { BotaoAcao } from "@/components/formulario/botao-acao";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusMensalidadeBadge } from "@/components/mensalidades/status-mensalidade";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusMensalidade } from "@/lib/generated/prisma/enums";
import { formatarCompetencia, formatarData } from "@/lib/datas";
import { decimalParaCentavos, formatarReais, centavosParaDecimal } from "@/lib/dinheiro";
import { filtroMensalidadesSchema } from "@/lib/esquemas/mensalidade";
import { mensalidadeService } from "@/server/mensalidades";
import { DIA_VENCIMENTO } from "@/server/mensalidades/mensalidade.service";
import { FiltroMensalidades } from "./_componentes/filtro-mensalidades";

export const metadata: Metadata = { title: "Mensalidades" };

export default async function Mensalidades({ searchParams }: PageProps<"/admin/mensalidades">) {
  const filtro = filtroMensalidadesSchema.parse(await searchParams);
  const [lista, competencias, paraFechar] = await Promise.all([
    mensalidadeService.listar(filtro),
    mensalidadeService.competencias(),
    mensalidadeService.competenciasParaFechar(),
  ]);

  const soma = (itens: typeof lista) =>
    formatarReais(centavosParaDecimal(itens.reduce((t, m) => t + decimalParaCentavos(m.valor), 0)));

  return (
    <>
      <CabecalhoPagina
        titulo="Mensalidades"
        descricao={`Soma das diárias de cada mês, fechada depois que o mês termina. Vence no dia ${DIA_VENCIMENTO} do mês seguinte.`}
      />

      {paraFechar.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fechar mês</CardTitle>
            <CardDescription>
              Gera a mensalidade de cada aluno com as diárias do mês, aplicando as isenções (justificativa aprovada,
              viagem cancelada). Depois de fechado, ajustes são feitos aluno a aluno.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {paraFechar.map((c) => (
              <BotaoAcao
                key={c}
                url="/api/mensalidades/fechamento"
                corpo={{ competencia: c }}
                mensagemSucesso={`${formatarCompetencia(c)} fechada.`}
                confirmacao={{
                  titulo: `Fechar ${formatarCompetencia(c)}?`,
                  descricao:
                    "Justificativas ainda pendentes deste mês, se aprovadas depois, recalculam a mensalidade enquanto ela não for paga.",
                  rotuloConfirmar: "Fechar mês",
                }}
              >
                Fechar {formatarCompetencia(c)}
              </BotaoAcao>
            ))}
          </CardContent>
        </Card>
      )}

      <FiltroMensalidades competencias={competencias} competencia={filtro.competencia} status={filtro.status} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead className="text-center">Diárias</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Vencimento</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhuma mensalidade encontrada.
                </TableCell>
              </TableRow>
            )}
            {lista.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Link href={`/admin/mensalidades/${m.id}`} className="font-medium hover:underline">
                    {m.aluno.nome}
                  </Link>
                </TableCell>
                <TableCell className="capitalize">{formatarCompetencia(m.competencia)}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {m.diariasCobradas}
                  {m.diariasIsentas > 0 && <span className="text-muted-foreground"> (+{m.diariasIsentas} isentas)</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatarReais(m.valor)}
                  {m.ajuste && <span className="block text-xs text-muted-foreground">com ajuste</span>}
                </TableCell>
                <TableCell className="text-center tabular-nums">{formatarData(m.vencimentoEm.slice(0, 10))}</TableCell>
                <TableCell className="text-center">
                  <StatusMensalidadeBadge status={m.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {lista.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>
                  Recebido: {soma(lista.filter((m) => m.status === StatusMensalidade.PAGA))}
                </TableCell>
                <TableCell className="text-right tabular-nums">{soma(lista)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </>
  );
}
