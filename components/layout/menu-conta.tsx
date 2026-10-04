"use client";

// Menu da conta no topo das áreas logadas: clicar no nome abre "Trocar senha" e "Sair".
import { useTransition } from "react";
import Link from "next/link";
import { ChevronDownIcon, KeyRoundIcon, LogOutIcon } from "lucide-react";
import { sairDaSessao } from "@/app/login/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MenuConta({ nome, email }: { nome: string; email: string }) {
  const [saindo, iniciar] = useTransition();
  const inicial = nome.trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Abrir menu da conta"
        className="flex items-center gap-2 rounded-md px-2 py-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"
      >
        <span className="hidden text-right leading-tight sm:block">
          <span className="block text-sm font-medium">{nome}</span>
          <span className="block text-xs text-muted-foreground">{email}</span>
        </span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {inicial}
        </span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-auto min-w-56">
        {/* No celular o nome não aparece no topo: mostra aqui. */}
        <DropdownMenuGroup className="sm:hidden">
          <DropdownMenuLabel>
            <span className="block text-sm font-medium text-foreground">{nome}</span>
            <span className="block font-normal">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="sm:hidden" />
        <DropdownMenuItem render={<Link href="/conta/senha" />}>
          <KeyRoundIcon />
          Trocar senha
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={saindo}
          onClick={() => iniciar(() => sairDaSessao())}
        >
          <LogOutIcon />
          {saindo ? "Saindo..." : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
