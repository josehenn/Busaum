// Erros de domínio. O service lança, sem saber nada de HTTP; quem traduz para
// status e JSON é server/comum/http.ts, no Route Handler.

export type ErrosPorCampo = Record<string, string[]>;

export abstract class ErroDeDominio extends Error {
  abstract readonly status: number;

  constructor(
    message: string,
    /** Mensagens por campo do formulário, quando o erro é de um campo específico. */
    readonly campos?: ErrosPorCampo,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Entrada malformada (Zod) ou regra de negócio violada. */
export class ErroDeValidacao extends ErroDeDominio {
  readonly status = 422;
}

/** Violaria uma unicidade (placa repetida, CPF repetido...). */
export class ErroDeConflito extends ErroDeDominio {
  readonly status = 409;
}

export class ErroNaoEncontrado extends ErroDeDominio {
  readonly status = 404;
}

/** Sem sessão, ou com o perfil errado para a operação. */
export class ErroDeAcesso extends ErroDeDominio {
  readonly status = 403;
}
