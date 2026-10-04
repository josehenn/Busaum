"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Opcao = { value: string; label: string };

/** Select de uma opção, controlado, no formato que os formulários usam. */
export function SelectSimples({
  id,
  opcoes,
  valor,
  aoMudar,
  placeholder,
  invalido,
  obrigatorio,
}: {
  id: string;
  opcoes: Opcao[];
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  invalido?: boolean;
  obrigatorio?: boolean;
}) {
  return (
    <Select items={opcoes} value={valor || null} onValueChange={(v) => aoMudar(v ?? "")}>
      <SelectTrigger
        id={id}
        className="w-full"
        aria-required={obrigatorio}
        aria-invalid={invalido}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
