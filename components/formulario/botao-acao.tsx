"use client";

// Botão que dispara uma ação na API (encerrar plano, cancelar viagem, aprovar
// justificativa...). Opcionalmente pede confirmação num diálogo — com ou sem um
// campo de texto, como o motivo de um cancelamento.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { enviarJson } from "@/lib/api";

type Confirmacao = {
  titulo: string;
  descricao?: string;
  rotuloConfirmar?: string;
  campoTexto?: { nome: string; rotulo: string; obrigatorio?: boolean; max?: number };
  destrutiva?: boolean;
};

export function BotaoAcao({
  url,
  metodo = "POST",
  corpo,
  children,
  variante = "outline",
  tamanho = "sm",
  confirmacao,
  mensagemSucesso,
  desabilitado,
}: {
  url: string;
  metodo?: "POST" | "PATCH" | "DELETE";
  corpo?: Record<string, unknown>;
  children: React.ReactNode;
  variante?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  tamanho?: "default" | "sm" | "xs";
  confirmacao?: Confirmacao;
  mensagemSucesso: string;
  desabilitado?: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function executar() {
    const campo = confirmacao?.campoTexto;
    if (campo?.obrigatorio && !texto.trim()) {
      setErro(`Informe ${campo.rotulo.toLowerCase()}.`);
      return;
    }

    setEnviando(true);
    const resultado = await enviarJson<{ mensagem?: string } | null>(url, metodo, {
      ...corpo,
      ...(campo && { [campo.nome]: texto.trim() }),
    });
    setEnviando(false);

    if (!resultado.ok) {
      const doCampo = campo && resultado.campos[campo.nome]?.[0];
      setErro(doCampo ?? resultado.erro);
      toast.error(resultado.erro);
      return;
    }

    toast.success(resultado.dados?.mensagem ?? mensagemSucesso);
    setAberto(false);
    setTexto("");
    setErro(null);
    router.refresh();
  }

  if (!confirmacao) {
    return (
      <Button variant={variante} size={tamanho} disabled={desabilitado || enviando} onClick={executar}>
        {children}
      </Button>
    );
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        setAberto(abrir);
        if (!abrir) setErro(null);
      }}
    >
      <DialogTrigger render={<Button variant={variante} size={tamanho} disabled={desabilitado} />}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirmacao.titulo}</DialogTitle>
          {confirmacao.descricao && <DialogDescription>{confirmacao.descricao}</DialogDescription>}
        </DialogHeader>

        {confirmacao.campoTexto ? (
          <Field data-invalid={Boolean(erro)}>
            <FieldLabel htmlFor="campo-acao" obrigatorio={confirmacao.campoTexto.obrigatorio}>
              {confirmacao.campoTexto.rotulo}
            </FieldLabel>
            <Textarea
              id="campo-acao"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setErro(null);
              }}
              maxLength={confirmacao.campoTexto.max ?? 500}
              aria-invalid={Boolean(erro)}
            />
            <FieldError>{erro}</FieldError>
          </Field>
        ) : (
          erro && <p className="text-sm text-destructive">{erro}</p>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Voltar</DialogClose>
          <Button
            variant={confirmacao.destrutiva ? "destructive" : "default"}
            disabled={enviando}
            onClick={executar}
          >
            {enviando ? "Enviando..." : (confirmacao.rotuloConfirmar ?? "Confirmar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
