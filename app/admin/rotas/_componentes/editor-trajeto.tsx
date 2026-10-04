"use client";

// Lista ordenada de pontos (ordem da ida). A volta percorre a mesma lista ao
// contrário, então não há um segundo trajeto para montar.
import { ArrowDownIcon, ArrowUpIcon, XIcon } from "lucide-react";
import { SelectSimples } from "@/components/formulario/select-simples";
import { Button } from "@/components/ui/button";

type PontoOpcao = { id: string; descricao: string; endereco: string };

export function EditorTrajeto({
  id,
  pontos,
  valor,
  aoMudar,
  invalido,
}: {
  id: string;
  pontos: PontoOpcao[];
  valor: string[];
  aoMudar: (ids: string[]) => void;
  invalido?: boolean;
}) {
  const porId = new Map(pontos.map((p) => [p.id, p]));
  const disponiveis = pontos
    .filter((p) => !valor.includes(p.id))
    .map((p) => ({ value: p.id, label: p.descricao }));

  function mover(indice: number, delta: -1 | 1) {
    const novo = [...valor];
    [novo[indice], novo[indice + delta]] = [novo[indice + delta], novo[indice]];
    aoMudar(novo);
  }

  return (
    <div className="space-y-2">
      {valor.length > 0 && (
        <ol className="divide-y rounded-lg border">
          {valor.map((pontoId, i) => {
            const ponto = porId.get(pontoId);
            return (
              <li key={pontoId} className="flex items-center gap-3 px-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ponto?.descricao ?? "Ponto inativo"}</p>
                  {ponto?.endereco && (
                    <p className="truncate text-xs text-muted-foreground">{ponto.endereco}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Subir"
                    disabled={i === 0}
                    onClick={() => mover(i, -1)}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Descer"
                    disabled={i === valor.length - 1}
                    onClick={() => mover(i, 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remover do trajeto"
                    onClick={() => aoMudar(valor.filter((x) => x !== pontoId))}
                  >
                    <XIcon />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {disponiveis.length > 0 && (
        <SelectSimples
          id={id}
          opcoes={disponiveis}
          valor=""
          aoMudar={(pontoId) => pontoId && aoMudar([...valor, pontoId])}
          placeholder={valor.length === 0 ? "Escolha o primeiro ponto" : "Adicionar próximo ponto"}
          invalido={invalido}
        />
      )}
    </div>
  );
}
