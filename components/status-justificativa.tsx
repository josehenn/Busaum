import { Badge } from "@/components/ui/badge";
import { StatusJustificativa } from "@/lib/generated/prisma/enums";
import { rotuloStatusJustificativa } from "@/lib/rotulos";

const variante = {
  [StatusJustificativa.PENDENTE]: "secondary",
  [StatusJustificativa.APROVADA]: "default",
  [StatusJustificativa.RECUSADA]: "destructive",
} as const;

export function StatusJustificativaBadge({ status }: { status: StatusJustificativa }) {
  return <Badge variant={variante[status]}>{rotuloStatusJustificativa[status]}</Badge>;
}
