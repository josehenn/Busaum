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
├── components/
│   ├── ui/               # Componentes do shadcn/ui (gerados; ajuste com cuidado)
│   └── layout/           # Casca das áreas, menu, cabeçalho de página
├── server/               # Camada de servidor: regras de negócio por módulo
│   ├── sessao/           # Sessão de demonstração (no lugar do Auth)
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
| Componente de UI genérico (botão, tabela...) | `npx shadcn@latest add <nome>` → `components/ui/` |
| Componente de UI reutilizável do projeto | `components/` |
| Tela da área do admin / do aluno | `app/admin/<modulo>/page.tsx` / `app/aluno/<modulo>/page.tsx` |
| Helper usado no cliente e no servidor | `lib/` |
| Interceptar requisições | `proxy.ts` na raiz (no Next 16 o antigo `middleware.ts` virou `proxy.ts`) |

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

## Áreas e sessão

- `/` e `/transparencia` são públicas. `/admin/*` e `/aluno/*` exigem sessão com o
  perfil certo: o `layout.tsx` de cada área chama `exigirPerfil()` e manda para
  `/login` quem não tem.
- A autenticação ficou fora desta entrega. `/login` é um **acesso de demonstração**:
  escolhe-se um usuário do seed e o id vai para um cookie. Tudo passa por
  `server/sessao/sessao.service.ts`, que é o único arquivo a mudar quando o Better
  Auth entrar.
- Item do menu sem página ainda cai em `app/<area>/[...modulo]/page.tsx` ("em
  construção"). Ao criar `app/admin/veiculos/page.tsx`, a rota específica passa na
  frente sozinha.
- Página que lê o banco sem usar `cookies()`/`headers()` precisa de
  `await connection()` (de `next/server`); senão o build tenta pré-renderizá-la.
