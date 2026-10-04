import { AreaLogada } from "@/components/layout/area-logada";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export default async function AlunoLayout({ children }: LayoutProps<"/aluno">) {
  const usuario = await exigirPerfil(PerfilUsuario.ALUNO);

  return (
    <AreaLogada area="aluno" usuario={usuario}>
      {children}
    </AreaLogada>
  );
}
