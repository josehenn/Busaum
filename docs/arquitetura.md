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
| Singleton | `lib/prisma.ts` | Uma única conexão com o banco, mesmo com o hot reload do dev |
| Repository | `server/*/*.repository.ts` + `prisma-*.repository.ts` | Service depende de interface, não do Prisma |
| Injeção de dependência | Construtor dos services; montagem em `server/*/index.ts` | Trocar implementação (ex.: repositório em memória) sem tocar na regra |
| DTO | `server/*/*.dto.ts` | Contrato de entrada e saída; controla o que é exposto |
| Adapter / Strategy | `StorageService`, `PaymentGateway` (módulos de Justificativas e Mensalidades) | Disco local × Vercel Blob; gateway fake × real |
