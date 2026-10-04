import type { UsuarioSessao } from "@/server/sessao/sessao.service";
import { Marca } from "./marca";
import { MenuConta } from "./menu-conta";
import { MenuMobile } from "./menu-mobile";
import { NavLinks } from "./nav-links";
import { nomeDaArea, type Area } from "./navegacao";

/** Casca comum das áreas do admin e do aluno: menu lateral, topo com o usuário e conteúdo. */
export function AreaLogada({
  area,
  usuario,
  children,
}: {
  area: Area;
  usuario: UsuarioSessao;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Marca />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks area={area} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <MenuMobile area={area} />
          <span className="text-sm text-muted-foreground">{nomeDaArea[area]}</span>
          <div className="ml-auto">
            <MenuConta nome={usuario.nome} email={usuario.email} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
