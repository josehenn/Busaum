"use client";

// Busca + filtro de status das listagens. Os filtros vivem na URL
// (?busca=&status=): dá para recarregar, voltar e compartilhar o link.
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { SelectSimples } from "@/components/formulario/select-simples";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TODOS = "TODOS";

export function FiltroLista({
  placeholder,
  opcoesStatus,
  rotuloTodos = "Todos os status",
  busca,
  status,
}: {
  placeholder: string;
  opcoesStatus?: { value: string; label: string }[];
  rotuloTodos?: string;
  busca?: string;
  status?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [texto, setTexto] = useState(busca ?? "");

  function aplicar(novoStatus?: string) {
    const params = new URLSearchParams();
    const b = texto.trim();
    const s = novoStatus ?? status ?? TODOS;
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
        aplicar();
      }}
    >
      <div className="relative min-w-60 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={100}
          className="pl-8"
        />
      </div>
      {opcoesStatus && (
        <div className="w-48">
          <SelectSimples
            id="filtro-status"
            opcoes={[{ value: TODOS, label: rotuloTodos }, ...opcoesStatus]}
            valor={status ?? TODOS}
            aoMudar={aplicar}
          />
        </div>
      )}
      <Button type="submit" variant="outline">
        Buscar
      </Button>
    </form>
  );
}
