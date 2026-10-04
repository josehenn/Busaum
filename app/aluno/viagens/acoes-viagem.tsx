"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { enviarJson } from "@/lib/api";
import { cn } from "@/lib/utils";

type Opcao = { rotulo: string; usaIda: boolean; usaVolta: boolean };

const CONTRATADO: Opcao[] = [
  { rotulo: "Vou", usaIda: true, usaVolta: true },
  { rotulo: "Só ida", usaIda: true, usaVolta: false },
  { rotulo: "Só volta", usaIda: false, usaVolta: true },
  { rotulo: "Não vou", usaIda: false, usaVolta: false },
];
const NAO_CONTRATADO: Opcao[] = [
  { rotulo: "Não vou", usaIda: false, usaVolta: false },
  { rotulo: "Quero ir", usaIda: true, usaVolta: true },
];

/** Botões de escolha do aluno para uma viagem. O marcado é a situação atual. */
export function AcoesViagem({
  viagemId,
  contratado,
  usaIda,
  usaVolta,
  vagas,
}: {
  viagemId: string;
  contratado: boolean;
  usaIda: boolean;
  usaVolta: boolean;
  vagas: number;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const opcoes = contratado ? CONTRATADO : NAO_CONTRATADO;

  async function escolher(opcao: Opcao) {
    setEnviando(true);
    const resultado = await enviarJson(`/api/aluno/viagens/${viagemId}`, "PUT", {
      usaIda: opcao.usaIda,
      usaVolta: opcao.usaVolta,
    });
    setEnviando(false);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Aviso registrado.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="O que você vai usar desta viagem">
      {opcoes.map((o) => {
        const marcada = o.usaIda === usaIda && o.usaVolta === usaVolta;
        // Pedido avulso precisa de lugar livre (quem já está dentro pode sair).
        const semLugar = !contratado && (o.usaIda || o.usaVolta) && !marcada && vagas === 0;
        return (
          <Button
            key={o.rotulo}
            size="sm"
            variant={marcada ? "default" : "outline"}
            aria-pressed={marcada}
            disabled={enviando || marcada || semLugar}
            onClick={() => escolher(o)}
            className={cn(marcada && "disabled:opacity-100")}
            title={semLugar ? "Sem lugar livre nesta viagem" : undefined}
          >
            {o.rotulo}
          </Button>
        );
      })}
    </div>
  );
}
