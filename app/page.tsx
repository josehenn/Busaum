import Link from "next/link";
import { CalendarCheckIcon, FileCheckIcon, ReceiptIcon } from "lucide-react";
import { TopoPublico } from "@/components/layout/topo-publico";
import { Button } from "@/components/ui/button";

const destaques = [
  {
    icone: CalendarCheckIcon,
    titulo: "Viagens previstas",
    texto: "O aluno contrata os dias da semana, o veículo sai dimensionado",
  },
  {
    icone: FileCheckIcon,
    titulo: "Faltas justificadas",
    texto: "Atestado ou aula cancelada, com anexo e aprovação da diretoria, isentam a diária",
  },
  {
    icone: ReceiptIcon,
    titulo: "Contas abertas",
    texto: "Mensalidade detalhada por diária e despesas publicadas na página de transparência",
  },
];

export default function Inicio() {
  return (
    <>
      <TopoPublico />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-16">
        <section className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Transporte universitário sem planilha
          </h1>
          <p className="text-lg text-muted-foreground">
            Organiza rotas, viagens, presença e mensalidades da associação de
            estudantes, além de mostrar para todo mundo onde o dinheiro foi gasto
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/transparencia" />}>
              Ver a transparência
            </Button>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {destaques.map(({ icone: Icone, titulo, texto }) => (
            <div key={titulo} className="space-y-2">
              <Icone className="size-5 text-muted-foreground" />
              <h2 className="font-medium">{titulo}</h2>
              <p className="text-sm text-muted-foreground">{texto}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
