"use client";

// Escolha de um mês na URL (?mes=AAAA-MM), com atalhos para o anterior e o seguinte.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { competenciaDe, formatarCompetencia, inicioDaCompetencia, somarDias, fimDaCompetencia } from "@/lib/datas";

export function NavegadorMes({ mes, maximo }: { mes: string; maximo?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function ir(novo: string) {
    const proximos = new URLSearchParams(params);
    proximos.set("mes", novo);
    router.push(`${pathname}?${proximos}`);
  }
  const anterior = competenciaDe(somarDias(inicioDaCompetencia(mes), -1));
  const seguinte = competenciaDe(fimDaCompetencia(mes));

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => ir(anterior)}>
        <ChevronLeftIcon />
      </Button>
      <span className="min-w-36 text-center font-medium capitalize">{formatarCompetencia(mes)}</span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Mês seguinte"
        onClick={() => ir(seguinte)}
        disabled={maximo !== undefined && seguinte > maximo}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
