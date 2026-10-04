// Resumo e diárias de uma mensalidade — a mesma visão para o admin e o aluno:
// a fatura mostra também o que NÃO foi cobrado, com o motivo.
import { Badge } from "@/components/ui/badge";
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
import { SituacaoDiaria } from "@/lib/generated/prisma/enums";
import { dataDeIso, diaSemanaIso, formatarData, formatarDataHora, nomeDiaCurto } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { rotuloSituacaoDiaria } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import type { MensalidadeDetalheDTO } from "@/server/mensalidades";

export function ResumoMensalidade({ m }: { m: MensalidadeDetalheDTO }) {
  const linhas: [string, React.ReactNode][] = [
    ["Diárias cobradas", m.diariasCobradas],
    ["Diárias isentas", m.diariasIsentas],
    ["Subtotal", formatarReais(m.subtotal)],
    [
      "Ajuste",
      m.ajuste ? (
        <span>
          {formatarReais(m.ajuste)}
          <span className="block text-xs text-muted-foreground">
            {m.motivoAjuste}
            {m.ajustadoPor && ` — ${m.ajustadoPor}, ${formatarDataHora(m.ajustadoEm!)}`}
          </span>
        </span>
      ) : (
        "—"
      ),
    ],
    ["Vencimento", formatarData(m.vencimentoEm.slice(0, 10))],
    ["Pago em", m.pagoEm ? `${formatarDataHora(m.pagoEm)}${m.baixaPor ? ` (baixa: ${m.baixaPor})` : ""}` : "—"],
    ["Referência", <span key="ref" className="font-mono text-xs">{m.referenciaGateway ?? "—"}</span>],
  ];

  return (
    <Card>
      <CardHeader>
        <CardDescription>Total</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{formatarReais(m.valor)}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {linhas.map(([rotulo, valor]) => (
            <div key={rotulo} className="contents">
              <dt className="text-muted-foreground">{rotulo}</dt>
              <dd className="text-right tabular-nums">{valor}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function TabelaDiarias({ m }: { m: MensalidadeDetalheDTO }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dia</TableHead>
            <TableHead>Rota</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {m.diarias.map((d) => {
            const cobrada = d.situacao === SituacaoDiaria.COBRADA;
            return (
              <TableRow key={d.id}>
                <TableCell className="tabular-nums">
                  {nomeDiaCurto[diaSemanaIso(dataDeIso(d.data))]} {formatarData(d.data)}
                </TableCell>
                <TableCell>
                  {d.rota}
                  {d.avulsa && (
                    <Badge variant="secondary" className="ml-2">
                      Avulsa
                    </Badge>
                  )}
                </TableCell>
                <TableCell className={cn(!cobrada && "text-muted-foreground")}>
                  {rotuloSituacaoDiaria[d.situacao]}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", !cobrada && "text-muted-foreground line-through")}>
                  {formatarReais(d.valor)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Subtotal ({m.diariasCobradas} cobradas)</TableCell>
            <TableCell className="text-right tabular-nums">{formatarReais(m.subtotal)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
