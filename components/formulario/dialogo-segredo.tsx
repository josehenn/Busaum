"use client";

// Mostra uma única vez um valor que o servidor não guarda (senha provisória,
// link de convite), com botão de copiar. Fechou, perdeu: o banco só tem o hash.
import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function DialogoSegredo({
  aberto,
  aoFechar,
  titulo,
  descricao,
  rotulo,
  valor,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao: React.ReactNode;
  rotulo: string;
  valor: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o texto continua selecionável.
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            readOnly
            value={valor}
            aria-label={rotulo}
            onFocus={(e) => e.currentTarget.select()}
            className="font-mono"
          />
          <Button type="button" variant="outline" size="icon" onClick={copiar} aria-label="Copiar" title="Copiar">
            {copiado ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Não será exibido novamente. Copie antes de fechar.
        </p>
        <DialogFooter>
          <Button type="button" onClick={aoFechar}>
            Já copiei
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
