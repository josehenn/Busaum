// Página pública. Pela LGPD, só lê Despesa e Veiculo — nenhum dado de aluno —
// e não mostra comprovantes (ver server/transparencia).
import type { Metadata } from "next";
import { z } from "zod";
import { NavegadorMes } from "@/components/formulario/navegador-mes";
import { TopoPublico } from "@/components/layout/topo-publico";
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
import { formatarCompetencia, formatarData } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { rotuloCategoriaDespesa } from "@/lib/rotulos";
import { transparenciaService } from "@/server/transparencia";

export const metadata: Metadata = {
  title: "Transparência",
  description: "Despesas do transporte universitário, por mês e por categoria.",
};

export default async function Transparencia({ searchParams }: PageProps<"/transparencia">) {
  const atual = transparenciaService.mesAtual();
  const mes = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .refine((m) => m <= atual)
    .catch(atual)
    .parse((await searchParams).mes);
  const r = await transparenciaService.resumo(mes);
  const maiorMes = Math.max(1, ...r.porMes.map((m) => Number(m.total)));

  return (
    <>
      <TopoPublico />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Transparência</h1>
            <p className="text-muted-foreground">
              Tudo o que a associação gasta com o transporte, publicado para alunos e famílias.
            </p>
          </div>
          <NavegadorMes mes={mes} maximo={atual} />
        </div>

        <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
          <Card>
            <CardHeader>
              <CardDescription className="capitalize">Gasto em {formatarCompetencia(mes)}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{formatarReais(r.totalDoMes)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {r.porCategoria.length === 0 && (
                    <TableRow>
                      <TableCell className="text-muted-foreground">Nada lançado neste mês.</TableCell>
                    </TableRow>
                  )}
                  {r.porCategoria.map((c) => (
                    <TableRow key={c.categoria}>
                      <TableCell>{rotuloCategoriaDespesa[c.categoria]}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatarReais(c.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimos 12 meses</CardTitle>
              <CardDescription>Total gasto em cada mês.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="w-1/2">
                      <span className="sr-only">Proporção</span>
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.porMes.map((m) => (
                    <TableRow key={m.mes} data-state={m.mes === mes ? "selected" : undefined}>
                      <TableCell className="capitalize">{formatarCompetencia(m.mes)}</TableCell>
                      <TableCell>
                        <div
                          className="h-2 rounded-full bg-primary/70"
                          style={{ width: `${(Number(m.total) / maiorMes) * 100}%` }}
                          aria-hidden
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatarReais(m.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lançamentos de {formatarCompetencia(mes)}</CardTitle>
            <CardDescription>Cada despesa, com data, veículo e valor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.lancamentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhuma despesa lançada neste mês.
                    </TableCell>
                  </TableRow>
                )}
                {r.lancamentos.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-center tabular-nums">{formatarData(d.data)}</TableCell>
                    <TableCell>{rotuloCategoriaDespesa[d.categoria]}</TableCell>
                    <TableCell>{d.descricao}</TableCell>
                    <TableCell>{d.veiculo ? `${d.veiculo.modelo} (${d.veiculo.placa})` : "Geral"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatarReais(d.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {r.lancamentos.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right tabular-nums">{formatarReais(r.totalDoMes)}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
