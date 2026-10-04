import { Badge } from "@/components/ui/badge";
import { StatusMensalidade } from "@/lib/generated/prisma/enums";
import { rotuloStatusMensalidade } from "@/lib/rotulos";

const variante = {
  [StatusMensalidade.ABERTA]: "secondary",
  [StatusMensalidade.PAGA]: "default",
  [StatusMensalidade.VENCIDA]: "destructive",
  [StatusMensalidade.CANCELADA]: "outline",
} as const;

export function StatusMensalidadeBadge({ status }: { status: StatusMensalidade }) {
  return <Badge variant={variante[status]}>{rotuloStatusMensalidade[status]}</Badge>;
}
