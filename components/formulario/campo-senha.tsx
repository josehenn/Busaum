"use client";

// Input de senha com botão de mostrar/ocultar.
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LIMITES_SENHA } from "@/lib/esquemas/senha";

export function CampoSenha({
  id,
  valor,
  aoMudar,
  aoSair,
  invalido,
  obrigatorio,
  autoComplete,
  autoFocus,
}: {
  id: string;
  valor: string;
  aoMudar: (valor: string) => void;
  aoSair?: () => void;
  invalido?: boolean;
  obrigatorio?: boolean;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visivel ? "text" : "password"}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        onBlur={aoSair}
        maxLength={LIMITES_SENHA.max}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-required={obrigatorio}
        aria-invalid={invalido}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        title={visivel ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {visivel ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}
