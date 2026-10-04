import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Marca } from "./marca";

/** Topo das páginas abertas ao público (início e transparência). */
export function TopoPublico() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
        <Marca />
        <nav className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/transparencia" />}>
            Transparência
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/login" />}>
            Entrar
          </Button>
        </nav>
      </div>
    </header>
  );
}
