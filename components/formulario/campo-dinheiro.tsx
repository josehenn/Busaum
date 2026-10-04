"use client";

import { Input } from "@/components/ui/input";
import { mascararReais } from "@/lib/dinheiro";

/** Valor em reais com máscara: os dígitos entram pela direita ("1234" → "12,34"). */
export function CampoDinheiro({
  id,
  valor,
  aoMudar,
  aoSair,
  invalido,
  obrigatorio,
  permitirNegativo,
}: {
  id: string;
  valor: string;
  aoMudar: (valor: string) => void;
  aoSair?: () => void;
  invalido?: boolean;
  obrigatorio?: boolean;
  /** Para ajustes: um "-" em qualquer posição deixa o valor negativo. */
  permitirNegativo?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        value={valor}
        onChange={(e) => {
          const negativo = permitirNegativo && e.target.value.includes("-");
          const mascarado = mascararReais(e.target.value);
          aoMudar(negativo && mascarado ? `-${mascarado}` : mascarado);
        }}
        onBlur={aoSair}
        inputMode={permitirNegativo ? "text" : "numeric"}
        placeholder="0,00"
        className="pl-9 text-right tabular-nums"
        aria-required={obrigatorio}
        aria-invalid={invalido}
      />
    </div>
  );
}
