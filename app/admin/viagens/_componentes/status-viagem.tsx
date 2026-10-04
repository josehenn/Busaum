import { Badge } from "@/components/ui/badge";
import { StatusViagem } from "@/lib/generated/prisma/enums";
import { rotuloStatusViagem } from "@/lib/rotulos";

const variante = {
  [StatusViagem.AGENDADA]: "default",
  [StatusViagem.REALIZADA]: "secondary",
  [StatusViagem.CANCELADA]: "destructive",
} as const;

export function StatusViagemBadge({ status }: { status: StatusViagem }) {
  return <Badge variant={variante[status]}>{rotuloStatusViagem[status]}</Badge>;
}
