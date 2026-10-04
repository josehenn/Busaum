import { Badge } from "@/components/ui/badge";

/** Badge para entidades com `ativo: boolean` (pontos, rotas). */
export function StatusAtivoBadge({
  ativo,
  rotulos = ["Ativo", "Inativo"],
}: {
  ativo: boolean;
  rotulos?: [string, string];
}) {
  return <Badge variant={ativo ? "default" : "outline"}>{ativo ? rotulos[0] : rotulos[1]}</Badge>;
}
