"use client";

import { DIAS_SEMANA, nomeDiaCurto, nomeDiaLongo } from "@/lib/datas";
import { cn } from "@/lib/utils";

/** Botões liga/desliga para os dias da semana (1 = segunda ... 7 = domingo). */
export function SeletorDias({
  id,
  valor,
  aoMudar,
  permitidos = [...DIAS_SEMANA],
  bloqueados = [],
  detalhes = {},
  invalido,
}: {
  id: string;
  valor: number[];
  aoMudar: (dias: number[]) => void;
  /** Dias que aparecem (ex.: só os dias em que a rota opera). */
  permitidos?: number[];
  /** Dias que aparecem desabilitados (ex.: lotados). */
  bloqueados?: number[];
  /** Texto pequeno embaixo de cada dia (ex.: "12/15"). */
  detalhes?: Record<number, string>;
  invalido?: boolean;
}) {
  function alternar(d: number) {
    aoMudar(valor.includes(d) ? valor.filter((x) => x !== d) : [...valor, d].sort((a, b) => a - b));
  }

  return (
    <div id={id} role="group" className="flex flex-wrap gap-2">
      {permitidos.map((d) => {
        const marcado = valor.includes(d);
        const bloqueado = bloqueados.includes(d) && !marcado;
        return (
          <button
            key={d}
            type="button"
            onClick={() => alternar(d)}
            disabled={bloqueado}
            aria-pressed={marcado}
            aria-label={nomeDiaLongo[d]}
            className={cn(
              "flex min-w-14 flex-col items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              marcado ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              invalido && !marcado && "border-destructive",
            )}
          >
            {nomeDiaCurto[d]}
            {detalhes[d] && (
              <span className={cn("text-[0.7rem] font-normal", marcado ? "opacity-80" : "text-muted-foreground")}>
                {detalhes[d]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
