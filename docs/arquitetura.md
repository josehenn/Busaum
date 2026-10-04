# Arquitetura

## Decisão

O BUSAUM é uma aplicação **Next.js full stack**. A estrutura anterior separava
`frontend/` (Next) e `backend/` (Express) em workspaces npm distintos; isso foi
substituído por um único projeto.

Motivos:

- O Next já resolve o papel do Express via Route Handlers (`app/api/*/route.ts`),
  então o servidor extra era uma camada a mais para manter, versionar e subir.
- Uma única base de tipos TypeScript: o tipo devolvido por um service em `server/`
  é o mesmo tipo consumido pela página, sem duplicação nem cliente HTTP no meio.
- Um processo, uma porta (3000), um build, um deploy.

## Fluxo de uma requisição

```
Navegador
   │
   ├── navegação  ──► app/**/page.tsx (Server Component)
   │                      └── chama server/<modulo>/*.service.ts  ── direto, sem HTTP
   │
   └── fetch/API  ──► app/api/**/route.ts (Route Handler)
                          └── chama server/<modulo>/*.service.ts
```

A regra: **Server Components chamam os services diretamente.** Não faça o servidor
buscar a própria API por HTTP — isso só adiciona uma ida e volta de rede.

Os Route Handlers existem para quem está fora do processo: o navegador (mutations,
polling, `fetch` de Client Component) e eventuais integrações externas.

## Camadas

| Camada | Pasta | Responsabilidade |
| --- | --- | --- |
| Apresentação | `app/`, `components/` | Renderizar UI com React, tratar interação |
| API | `app/api/` | Validar entrada HTTP, chamar o service, serializar resposta |
| Domínio | `server/` | Regras de negócio e acesso a dados |
| Compartilhado | `lib/` | Helpers sem dependência de camada |

Um Route Handler deve ser fino: ele traduz HTTP para chamada de service e de volta.
Regra de negócio dentro de `route.ts` fica inacessível para as páginas.

## React

React é a biblioteca de UI, consumida através do Next. Componentes são Server
Components por padrão; `"use client"` é opt-in e deve ficar o mais próximo possível
da folha da árvore, para não arrastar a página inteira para o cliente.

## Padrão de um módulo (referência: Veículos)

Todo módulo segue o mesmo desenho do módulo de Veículos — copie a estrutura dele.

```
lib/esquemas/veiculo.ts           # Schemas Zod de entrada — usados pelo service E pelo formulário
server/veiculos/
├── veiculo.dto.ts                # Reexporta os schemas + saída (VeiculoDTO + mapper)
├── veiculo.repository.ts         # Interface IVeiculoRepository + tipo da entidade
├── prisma-veiculo.repository.ts  # Implementação com Prisma
├── veiculo.service.ts            # Regras de negócio; recebe o repositório no construtor
└── index.ts                      # Monta o service com o repositório concreto

app/api/veiculos/route.ts         # GET (lista), POST (cria)
app/api/veiculos/[id]/route.ts    # GET (um), PATCH (altera)
app/admin/veiculos/               # Telas: listagem, novo, [id] (edição)
└── _componentes/                 # Componentes só deste módulo (pasta privada)
```

Como uma requisição atravessa as camadas:

```
Formulário (Client Component)
  └─ enviarJson()  ── lib/api.ts
       └─ Route Handler: exigirPerfilNaApi → lerJson → service → NextResponse.json
            └─ Service: validar(schema) → regras → repositório
                 └─ Repositório Prisma → banco
  ◄── erro de domínio → responderErro() → { erro, campos } com 403/404/409/422
```

Regras do padrão:

- **A validação roda dos dois lados com o mesmo schema** (`lib/esquemas/`):
  - na tela, ao sair de cada campo e ao enviar — com erro, nada é enviado;
  - no service (`validar(schema, entrada)`), porque a API pode ser chamada sem a
    tela. Só o servidor valida o que depende do banco (placa já cadastrada).
- **Formulários usam `useFormulario`** (`components/formulario/`): estado, erros
  ao sair do campo/enviar, erros da API por campo. Selects usam `SelectSimples`.
  Documentos e telefones guardam só dígitos; a máscara é da tela (`lib/mascaras.ts`).
- **Inputs limitam o que dá para digitar**: `maxLength` com os valores de
  `LIMITES_*` do schema, máscara de caracteres (placa só letras/números, capacidade
  só dígitos). Campo obrigatório tem `<FieldLabel obrigatorio>` (asterisco vermelho)
  e `aria-required`.
- **O service lança erros de domínio** (`server/comum/erros.ts`) e não conhece HTTP.
  `responderErro()` traduz: validação/regra → 422, unicidade → 409, inexistente →
  404, sem permissão → 403.
- **A autorização se repete na API** (`exigirPerfilNaApi`), além do layout: a API
  pode ser chamada direto, sem passar por página nenhuma.
- **Nada é apagado.** Não há DELETE; sai de circulação por `status`.
- **O DTO de resposta escolhe os campos.** Dado sensível (CPF, telefone) nunca entra.
- **Textos de enum** ficam em `lib/rotulos.ts`, que os Client Components também usam.
- **Listagens:** colunas de texto alinhadas à esquerda; numéricas (com
  `tabular-nums`) e de status (badges) centralizadas — cabeçalho e célula.

## Padrões de projeto e onde estão

| Padrão | Onde | Para quê |
| --- | --- | --- |
| MVC (adaptado ao App Router) | Model: `prisma/schema.prisma` + entidades dos repositórios · View: `app/**/page.tsx`, `components/` · Controller: `app/api/**/route.ts` | Separar dados, apresentação e entrada HTTP |
| Singleton | `lib/prisma.ts` | Uma única conexão com o banco, mesmo com o hot reload do dev |
| Repository | `server/*/*.repository.ts` (interface) + `prisma-*.repository.ts` | Service depende de interface, não do Prisma |
| Injeção de dependência / Composition root | Construtor dos services; `server/repositorios.ts` instancia os repositórios e cada `server/*/index.ts` monta seu service | Trocar implementação sem tocar na regra; um service usa o repositório de outro módulo sem ciclo de import |
| DTO | `lib/esquemas/*.ts` (entrada, Zod) e `server/*/*.dto.ts` / tipos `*DTO` (saída) | Contrato de entrada e saída; controla o que é exposto (LGPD) |
| Adapter | `server/arquivos/`: `IStorageService` → `LocalStorageService` (dev) e `VercelBlobStorageService` (produção) | Guardar anexos sem o sistema saber onde |
| Strategy | `server/pagamentos/`: `PaymentGateway` → `FakePaymentGateway` | Trocar o provedor de pagamento sem mudar a regra de mensalidade |
| Middleware (de requisição) | `proxy.ts` (checagem otimista do cookie); `manipulador()` em `server/comum/http.ts` envolve todo Route Handler (origem + erros); `exigirPerfil*` na sessão | Autenticação, CSRF e tradução de erros em um lugar só |
| Data Access Layer (DAL) | `server/sessao/sessao.service.ts` | Único lugar que lê a sessão; o resto recebe um `UsuarioSessao` |

## Autenticação e autorização

Login com e-mail e senha pelo **Better Auth** (`server/auth/auth.ts`), com sessão no
banco. A verificação acontece em camadas, porque nenhuma sozinha basta:

| Camada | Onde | O que faz |
| --- | --- | --- |
| 1. Proxy | `proxy.ts` | Sem o cookie de sessão, `/admin`, `/aluno` e `/conta` redirecionam para `/login` antes de renderizar. Só olha se o cookie existe (roda em toda navegação, não consulta o banco) |
| 2. Páginas e layouts | `exigirPerfil()` em todo `page.tsx` e `layout.tsx` das áreas | Valida a sessão no banco e o perfil. Fica também na página porque o layout não roda de novo na navegação do cliente |
| 3. API | `exigirPerfilNaApi()` em todo Route Handler | A API pode ser chamada direto, sem tela: 401 sem sessão, 403 com perfil errado ou senha provisória |
| 4. Service | services de aluno (`alunoId` da sessão) | O aluno nunca age em nome de outro: o id vem da sessão, não do corpo da requisição |

Como o aluno ganha acesso:
- **Convite** (`/admin/alunos/convites`): o admin gera um link `/cadastro/<token>`; o
  aluno preenche os próprios dados e cria a senha. Uso único, 7 dias, revogável,
  opcionalmente preso a um e-mail.
- **Cadastro pelo admin**: o sistema gera uma senha provisória, mostrada uma única
  vez. No primeiro acesso o aluno é obrigado a trocá-la (`/conta/senha`). O admin pode
  redefinir a senha depois (gera outra provisória e derruba as sessões).

| Ameaça | Defesa |
| --- | --- |
| Vazamento do banco expor senhas | Hash scrypt com sal (Better Auth); convites guardados como SHA-256 do token |
| Força bruta no login | Limite de 5 tentativas por minuto por IP, contado no banco (`LimiteRequisicao`) → 429 |
| Descobrir quais e-mails existem | Login responde sempre "E-mail ou senha incorretos."; convite inválido, vencido ou usado têm a mesma mensagem |
| Cookie forjado ou roubado depois do logout | O cookie só carrega um token assinado; a sessão é conferida no banco a cada requisição e apagada no logout, na troca e na redefinição de senha |
| CSRF (outro site disparando ações com o cookie da vítima) | Cookie `SameSite=Lax` + `httpOnly`; Better Auth confere a origem nos endpoints dele; `manipulador()` recusa POST/PATCH/DELETE de outra origem; Server Actions têm a checagem do próprio Next |
| Escalada de perfil | `perfil` e `trocarSenha` com `input: false`: nenhuma requisição os define; autocadastro pela API do Better Auth desligado (`disableSignUp`) |
| Redirecionamento aberto (`/login?proxima=https://golpe.com`) | `caminhoInterno()` em `lib/redirecionamento.ts` só aceita caminhos do próprio site |
| Convite usado duas vezes ao mesmo tempo | `updateMany` com `usadoEm: null` dentro da transação: só um cadastro marca o convite |
| Token do convite vazar pelo Referer ou buscadores | Página do cadastro com `referrer: no-referrer` e `noindex` |

## Regras de domínio centralizadas

Algumas regras são usadas por vários módulos e moram em **funções puras**, sem
banco, para existir uma resposta só:

| Regra | Onde | Quem usa |
| --- | --- | --- |
| Quem é esperado numa viagem; plano vigente no prazo; pontos a pular | `server/viagens/esperados.ts` | Viagens (lista do motorista), Declarações (vaga do avulso), Justificativas, Mensalidades |
| Ocupação por dia da semana | `server/planos/ocupacao.ts` | Planos (trava de lotação), Rotas (troca de veículo) |
| Apuração da competência | `server/mensalidades/apuracao.ts` | Fechamento do mês |
| Datas no fuso de Brasília | `lib/datas.ts` | Todos |
| Dinheiro em centavos | `lib/dinheiro.ts` | Rotas, Mensalidades, Despesas |
