"use client";

// Escolha de um dia na URL (?dia=AAAA-MM-DD), com atalhos para o anterior,
// o seguinte e hoje.
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dataDeIso, dataIso, nomeDiaLongo, diaSemanaIso, somarDias } from "@/lib/datas";

export function NavegadorDia({ dia, hoje }: { dia: string; hoje: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const ir = (novo: string) => router.push(`${pathname}?dia=${novo}`);
  const mover = (n: number) => ir(dataIso(somarDias(dataDeIso(dia), n)));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Dia anterior" onClick={() => mover(-1)}>
        <ChevronLeftIcon />
      </Button>
      <Input
        type="date"
        value={dia}
        onChange={(e) => e.target.value && ir(e.target.value)}
        className="w-44"
        aria-label="Dia"
      />
      <Button variant="outline" size="icon" aria-label="Dia seguinte" onClick={() => mover(1)}>
        <ChevronRightIcon />
      </Button>
      <Button variant="ghost" onClick={() => ir(hoje)} disabled={dia === hoje}>
        Hoje
      </Button>
      <span className="text-sm text-muted-foreground capitalize">{nomeDiaLongo[diaSemanaIso(dataDeIso(dia))]}</span>
    </div>
  );
}
