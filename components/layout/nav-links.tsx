"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navegacao, type Area } from "./navegacao";

export function NavLinks({ area, aoNavegar }: { area: Area; aoNavegar?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {navegacao[area].map(({ href, rotulo, icone: Icone }) => {
        // A página inicial da área só fica ativa nela mesma; as outras, em qualquer subrota.
        const ativo = href === `/${area}` ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={aoNavegar}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              ativo && "bg-muted text-foreground",
            )}
          >
            <Icone className="size-4" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
