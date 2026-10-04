"use client";

// Select de registros com um botão ao lado que abre um modal para cadastrar um
// novo. O campo nunca aceita texto livre: o registro é criado na API e já volta
// selecionado. Usado para instituição (aluno e ponto).
import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { SelectSimples } from "@/components/formulario/select-simples";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enviarJson } from "@/lib/api";

type Opcao = { value: string; label: string };

export function SelectComCadastro<T>({
  id,
  opcoes,
  valor,
  aoMudar,
  placeholder,
  invalido,
  obrigatorio,
  cadastro,
}: {
  id: string;
  opcoes: Opcao[];
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  invalido?: boolean;
  obrigatorio?: boolean;
  cadastro: {
    /** Ex.: "Nova instituição". */
    titulo: string;
    descricao?: string;
    rotulo: string;
    /** POST { nome } → registro criado. */
    url: string;
    max: number;
    paraOpcao: (criado: T) => Opcao;
  };
}) {
  // Os criados aqui entram na lista sem recarregar a página.
  const [criados, setCriados] = useState<Opcao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function cadastrar() {
    if (!nome.trim()) {
      setErro(`Informe o ${cadastro.rotulo.toLowerCase()}.`);
      return;
    }
    setEnviando(true);
    const resultado = await enviarJson<T>(cadastro.url, "POST", { nome: nome.trim() });
    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.campos.nome?.[0] ?? resultado.erro);
      return;
    }
    const opcao = cadastro.paraOpcao(resultado.dados);
    setCriados((atuais) => [...atuais, opcao]);
    aoMudar(opcao.value);
    toast.success(`Cadastrado e selecionado: ${opcao.label}.`);
    setAberto(false);
    setNome("");
  }

  const todas = [...opcoes, ...criados.filter((c) => !opcoes.some((o) => o.value === c.value))];

  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        <SelectSimples
          id={id}
          opcoes={todas}
          valor={valor}
          aoMudar={aoMudar}
          placeholder={placeholder}
          invalido={invalido}
          obrigatorio={obrigatorio}
        />
      </div>

      <Dialog
        open={aberto}
        onOpenChange={(abrir) => {
          setAberto(abrir);
          if (!abrir) setErro(null);
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={cadastro.titulo}
          title={cadastro.titulo}
          onClick={() => setAberto(true)}
        >
          <PlusIcon />
        </Button>
        <DialogContent>
          {/* Form próprio: Enter cadastra sem enviar o formulário de fora. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cadastrar();
            }}
            className="grid gap-4"
          >
            <DialogHeader>
              <DialogTitle>{cadastro.titulo}</DialogTitle>
              {cadastro.descricao && <DialogDescription>{cadastro.descricao}</DialogDescription>}
            </DialogHeader>
            <Field data-invalid={Boolean(erro)}>
              <FieldLabel htmlFor={`${id}-novo`} obrigatorio>
                {cadastro.rotulo}
              </FieldLabel>
              <Input
                id={`${id}-novo`}
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErro(null);
                }}
                maxLength={cadastro.max}
                autoFocus
                aria-required
                aria-invalid={Boolean(erro)}
              />
              <FieldError>{erro}</FieldError>
            </Field>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Cadastrando..." : "Cadastrar e selecionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
