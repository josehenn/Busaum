import { AreaLogada } from "@/components/layout/area-logada";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const usuario = await exigirPerfil(PerfilUsuario.ADMIN);

  return (
    <AreaLogada area="admin" usuario={usuario}>
      {children}
    </AreaLogada>
  );
}
