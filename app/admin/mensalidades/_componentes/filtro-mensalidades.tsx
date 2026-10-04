"use client";

import { usePathname, useRouter } from "next/navigation";
import { SelectSimples } from "@/components/formulario/select-simples";
import { formatarCompetencia } from "@/lib/datas";
import { opcoes, rotuloStatusMensalidade } from "@/lib/rotulos";

const TODOS = "TODOS";

export function FiltroMensalidades({
  competencias,
  competencia,
  status,
}: {
  competencias: string[];
  competencia?: string;
  status?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function aplicar(novo: { competencia?: string; status?: string }) {
    const params = new URLSearchParams();
    const c = novo.competencia ?? competencia ?? TODOS;
    const s = novo.status ?? status ?? TODOS;
    if (c !== TODOS) params.set("competencia", c);
    if (s !== TODOS) params.set("status", s);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <div className="w-52">
        <SelectSimples
          id="filtro-competencia"
          opcoes={[
            { value: TODOS, label: "Todos os meses" },
            ...competencias.map((c) => ({ value: c, label: formatarCompetencia(c) })),
          ]}
          valor={competencia ?? TODOS}
          aoMudar={(c) => aplicar({ competencia: c })}
        />
      </div>
      <div className="w-48">
        <SelectSimples
          id="filtro-status"
          opcoes={[{ value: TODOS, label: "Todos os status" }, ...opcoes(rotuloStatusMensalidade)]}
          valor={status ?? TODOS}
          aoMudar={(s) => aplicar({ status: s })}
        />
      </div>
    </div>
  );
}
