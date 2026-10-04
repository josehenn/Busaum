"use client";

// Estado e validação comuns a todos os formulários do sistema.
//
// - Valida na tela com o mesmo schema Zod que o service usa no servidor.
// - Erro de um campo só aparece depois que o usuário passou por ele (blur) ou
//   tentou enviar — ninguém quer ver "Informe o nome" antes de começar a digitar.
// - Erros devolvidos pela API (ex.: CPF já cadastrado) aparecem no campo e somem
//   quando o campo é editado.
import { useState } from "react";
import type { z } from "zod";
import { errosDoSchema, type ErrosPorCampo } from "@/lib/esquemas/erros";

export function useFormulario<V extends Record<string, string>>({
  inicial,
  schema,
  paraCorpo,
}: {
  inicial: V;
  schema: z.ZodType;
  /** Converte os valores da tela (sempre string) no corpo que a API espera. */
  paraCorpo: (valores: V) => unknown;
}) {
  type Campo = keyof V & string;

  const [valores, setValores] = useState<V>(inicial);
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [errosServidor, setErrosServidor] = useState<ErrosPorCampo>({});

  const corpo = paraCorpo(valores);
  const errosTela = errosDoSchema(schema, corpo);

  function atualizar(campo: Campo, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    setErrosServidor((atuais) => {
      const proximos = { ...atuais };
      delete proximos[campo];
      return proximos;
    });
  }

  function tocar(campo: Campo) {
    setTocados((atuais) => ({ ...atuais, [campo]: true }));
  }

  /** Mensagens do campo no formato do <FieldError errors>. */
  function erroDe(campo: Campo) {
    const daTela = tentouEnviar || tocados[campo] ? errosTela[campo] : undefined;
    return (daTela ?? errosServidor[campo])?.map((message) => ({ message }));
  }

  function invalido(campo: Campo) {
    return Boolean(erroDe(campo)?.length);
  }

  /** Chamar no submit: mostra todos os erros e diz se pode enviar. */
  function podeEnviar() {
    setTentouEnviar(true);
    return Object.keys(errosTela).length === 0;
  }

  return {
    valores,
    corpo,
    atualizar,
    tocar,
    erroDe,
    invalido,
    podeEnviar,
    definirErrosServidor: setErrosServidor,
  };
}
