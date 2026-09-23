# Estrutura de pastas

O projeto é um único app Next.js na raiz do repositório. Front e back moram juntos:
o React renderiza as telas e os Route Handlers do Next expõem a API.

```
.
├── app/                  # App Router: rotas, layouts e API
│   ├── layout.tsx        # Layout raiz (html/body, fontes, metadata)
│   ├── page.tsx          # Rota "/"
│   ├── globals.css       # Tailwind + tokens de tema
│   └── api/              # Route Handlers (a API)
│       └── hello/route.ts
├── components/           # Componentes React reutilizáveis
├── server/               # Camada de servidor: regras de negócio por módulo
│   └── hello/hello.service.ts
├── lib/                  # Utilidades compartilhadas (client + server)
├── public/               # Arquivos estáticos servidos em /
├── tests/                # Testes
├── docs/                 # Documentação
├── next.config.ts
├── tsconfig.json         # alias "@/*" aponta para a raiz
├── eslint.config.mjs
└── postcss.config.mjs
```

## Onde colocar cada coisa

| Quero criar | Vai em |
| --- | --- |
| Uma página nova | `app/<rota>/page.tsx` |
| Um endpoint de API | `app/api/<recurso>/route.ts` |
| Regra de negócio / acesso a dados | `server/<modulo>/<modulo>.service.ts` |
| Componente de UI reutilizável | `components/` |
| Helper usado no cliente e no servidor | `lib/` |
| Middleware de requisição | `middleware.ts` na raiz (API do Next) |

## Convenções

- **Server Components por padrão.** Só marque `"use client"` no componente que
  realmente precisa de estado, efeito ou evento do navegador.
- **`server/` nunca é importado por Client Component.** Esse código roda apenas no
  servidor; se um componente de cliente precisar do dado, busque na página (Server
  Component) e passe por props, ou chame o Route Handler.
- **Imports com alias:** `@/server/...`, `@/components/...`, `@/lib/...`.
- **Variáveis de ambiente:** só o que tem prefixo `NEXT_PUBLIC_` chega ao navegador.
  Segredos ficam sem prefixo e são lidos apenas em `server/`, `app/api/` ou Server
  Components.
