"use client";

// Filtros da listagem. Vivem na URL (?busca=&status=): dá para recarregar,
// voltar e compartilhar o link sem perder o filtro.
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { SelectSimples } from "@/components/formulario/select-simples";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { opcoes, rotuloStatusAluno } from "@/lib/rotulos";

const TODOS = "TODOS";
const opcoesStatus = [{ value: TODOS, label: "Todos os status" }, ...opcoes(rotuloStatusAluno)];

export function FiltroAlunos({ busca, status }: { busca?: string; status?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [texto, setTexto] = useState(busca ?? "");

  function aplicar(novo: { busca?: string; status?: string }) {
    const params = new URLSearchParams();
    const b = (novo.busca ?? texto).trim();
    const s = novo.status ?? status ?? TODOS;
    if (b) params.set("busca", b);
    if (s !== TODOS) params.set("status", s);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      className="mb-4 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        aplicar({});
      }}
    >
      <div className="relative min-w-60 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nome, e-mail ou matrícula"
          aria-label="Buscar alunos"
          maxLength={100}
          className="pl-8"
        />
      </div>
      <div className="w-48">
        <SelectSimples
          id="filtro-status"
          opcoes={opcoesStatus}
          valor={status ?? TODOS}
          aoMudar={(s) => aplicar({ status: s })}
        />
      </div>
      <Button type="submit" variant="outline">
        Buscar
      </Button>
    </form>
  );
}
