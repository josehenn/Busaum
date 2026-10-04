// Página pública. Pela LGPD, só lê Despesa e Veiculo — nenhum dado de aluno aparece aqui.
// Esqueleto do layout; os dados entram com o módulo de Despesas.
import type { Metadata } from "next";
import { TopoPublico } from "@/components/layout/topo-publico";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Transparência",
  description: "Despesas do transporte universitário, por mês e por categoria.",
};

export default function Transparencia() {
  return (
    <>
      <TopoPublico />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Transparência</h1>
          <p className="text-muted-foreground">
            Tudo o que a associação gasta com o transporte, publicado para alunos e famílias.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total por mês</CardTitle>
              <CardDescription>Soma das despesas lançadas em cada mês.</CardDescription>
            </CardHeader>
            <CardContent>
              <TabelaVazia colunas={["Mês", "Total"]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Por categoria</CardTitle>
              <CardDescription>Combustível, manutenção, pedágio, seguro, salários.</CardDescription>
            </CardHeader>
            <CardContent>
              <TabelaVazia colunas={["Categoria", "Total"]} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lançamentos</CardTitle>
            <CardDescription>Cada despesa, com data, veículo e valor.</CardDescription>
          </CardHeader>
          <CardContent>
            <TabelaVazia colunas={["Data", "Categoria", "Descrição", "Veículo", "Valor"]} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function TabelaVazia({ colunas }: { colunas: string[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {colunas.map((c) => (
            <TableHead key={c}>{c}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={colunas.length} className="py-8 text-center text-muted-foreground">
            Os dados serão publicados em breve.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
