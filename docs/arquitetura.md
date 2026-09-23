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
