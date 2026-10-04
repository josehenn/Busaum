"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SelectSimples } from "@/components/formulario/select-simples";
import { Button } from "@/components/ui/button";
import { enviarJson } from "@/lib/api";

export function TrocarVeiculo({
  viagemId,
  atual,
  veiculos,
}: {
  viagemId: string;
  atual: string;
  veiculos: { id: string; placa: string; modelo: string; capacidade: number }[];
}) {
  const router = useRouter();
  const [veiculoId, setVeiculoId] = useState(atual);
  const [enviando, setEnviando] = useState(false);

  async function trocar() {
    setEnviando(true);
    const resultado = await enviarJson(`/api/viagens/${viagemId}/veiculo`, "POST", { veiculoId });
    setEnviando(false);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Veículo da viagem trocado.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="min-w-56 flex-1">
        <SelectSimples
          id="veiculo-viagem"
          opcoes={veiculos.map((v) => ({ value: v.id, label: `${v.placa} — ${v.capacidade} lugares` }))}
          valor={veiculoId}
          aoMudar={setVeiculoId}
        />
      </div>
      <Button variant="outline" onClick={trocar} disabled={enviando || veiculoId === atual}>
        Trocar
      </Button>
    </div>
  );
}
