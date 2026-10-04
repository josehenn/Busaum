"use client";

// Texto livre com sugestões: a pessoa pode escolher uma opção da lista ou
// digitar algo que não está nela. O valor do campo é sempre o texto.
import { Autocomplete } from "@base-ui/react/autocomplete";
import { Input } from "@/components/ui/input";
import { normalizarBusca } from "@/lib/texto";

export type Sugestao = {
  /** Texto que vai para o campo ao escolher a sugestão. */
  valor: string;
  /** Texto secundário mostrado ao lado (ex.: a sigla). */
  detalhe?: string;
};

export function CampoAutocomplete({
  id,
  sugestoes,
  valor,
  aoMudar,
  aoSair,
  placeholder,
  maxLength,
  invalido,
  obrigatorio,
}: {
  id: string;
  sugestoes: Sugestao[];
  valor: string;
  aoMudar: (valor: string) => void;
  aoSair?: () => void;
  placeholder?: string;
  maxLength?: number;
  invalido?: boolean;
  obrigatorio?: boolean;
}) {
  return (
    <Autocomplete.Root
      items={sugestoes}
      value={valor}
      onValueChange={(v) => aoMudar(v)}
      itemToStringValue={(s: Sugestao) => s.valor}
      // Busca no texto e no detalhe, ignorando acentos: "ufsc" e "catarina" acham a UFSC.
      filter={(s: Sugestao, busca: string) =>
        normalizarBusca(`${s.valor} ${s.detalhe ?? ""}`).includes(normalizarBusca(busca))
      }
      openOnInputClick
    >
      <Autocomplete.Input
        render={
          <Input
            id={id}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete="off"
            aria-required={obrigatorio}
            aria-invalid={invalido}
            onBlur={aoSair}
          />
        }
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} className="isolate z-50">
          <Autocomplete.Popup className="max-h-64 w-(--anchor-width) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 data-empty:hidden">
            <Autocomplete.List>
              {(s: Sugestao) => (
                <Autocomplete.Item
                  key={s.valor}
                  value={s}
                  className="flex cursor-default items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <span className="truncate">{s.valor}</span>
                  {s.detalhe && (
                    <span className="shrink-0 text-xs text-muted-foreground">{s.detalhe}</span>
                  )}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
