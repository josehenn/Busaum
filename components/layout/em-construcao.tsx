import { ConstructionIcon } from "lucide-react";

/** Ocupa o lugar dos módulos ainda não implementados, para o menu não levar a um 404. */
export function EmConstrucao() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
      <ConstructionIcon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-medium">Módulo em construção</p>
        <p className="text-sm text-muted-foreground">Esta tela chega em uma das próximas entregas.</p>
      </div>
    </div>
  );
}
