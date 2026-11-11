# Ipase das Letras

Aplicação web criada para divulgar e organizar as atividades do projeto comunitário de incentivo à leitura no bairro Ipase, em Várzea Grande–MT.

## Visão geral

A solução foi desenvolvida com React + Vite + TypeScript, estilização em Tailwind CSS e estrutura de páginas públicas e administrativa separadas. O projeto contempla:

- Página inicial com apresentação do projeto.
- Página de sobre o programa e sua identidade cultural.
- Calendário com eventos diários e de múltiplos dias.
- Página de contato com divulgação via WhatsApp.
- Área administrativa protegida, com autenticação real do Supabase e autorização por e-mail previamente validado.

## Tecnologias

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- date-fns
- Lucide React
- Zod + React Hook Form
- Supabase JS
- Vitest + Testing Library

## Requisitos

- Node.js 22+
- npm

## Instalação

```bash
npm install
npm run dev
```

## Ambientes

Copie `.env.example` para `.env` para usar o acesso demonstrativo local. O modo demo usa dados locais e não precisa de Supabase:

```env
VITE_APP_MODE=demo
VITE_ENABLE_ADMIN_PROTOTYPE=true
VITE_ADMIN_PROTOTYPE_EMAIL=admin@ipase.local
VITE_ADMIN_PROTOTYPE_PASSWORD=ipase2026
```

Essas credenciais são somente uma conveniência de protótipo, embutidas na aplicação cliente e **não são autenticação segura**. Não reutilize dados sensíveis. Os eventos de demonstração são isolados no `localStorage` do navegador.

Para produção, use uma implantação separada e configure:

```env
VITE_APP_MODE=supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-ou-publishable
```

O cliente usa somente a chave anon/publishable. **Nunca coloque `service_role`, senha de banco ou outra chave privilegiada em variáveis `VITE_` ou no navegador.** Se o modo de produção não estiver configurado ou a autenticação falhar, o aplicativo não alterna para demo. `.env` está ignorado pelo Git; mantenha apenas valores fictícios em `.env.example`.

## Supabase e primeira administradora

1. Crie o projeto Supabase e um usuário da administradora em Authentication > Users, com e-mail verificado.
2. Execute `supabase/schema.sql` no SQL Editor. O script mantém tabelas existentes, acrescenta colunas de forma incremental e recria as policies sem apagar registros.
3. Cadastre a primeira identidade administrativa manualmente no SQL Editor, que executa com privilégios de operador:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'email-confirmado-da-administradora';
```

4. Verifique a autorização com `select public.is_admin()` após autenticar como essa usuária. Uma pessoa autenticada sem registro em `admin_users` não deve conseguir escrever.
5. Configure as variáveis de produção no provedor de hospedagem. A função `public.is_admin()` e RLS são a barreira de autorização; lista de e-mails no frontend não concede privilégios.

A tabela `admin_users` não concede acesso de escrita a `anon` nem `authenticated`, e não possui policy de autoinscrição. Atribuições seguintes devem ser feitas por um operador autorizado no SQL Editor ou por um fluxo administrativo servidor-side devidamente protegido.

## Atualização da programação

No modo demo, entre em `/admin`, use o botão “Entrar na demonstração”, edite ou crie eventos no painel e publique-os para que apareçam na agenda e na página inicial. “Restaurar dados” repõe os encontros demonstrativos gerados no código. Isso não grava nada no banco de produção.

No modo Supabase, os eventos públicos consultam registros publicados no PostgreSQL; o painel exige login autorizado via `public.is_admin()`. A configuração Supabase real e suas policies ainda precisam ser aplicadas e verificadas no projeto antes de publicação.

## Execução local no Windows

No PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Para alterar variáveis, reinicie o servidor Vite.

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Estrutura principal

```text
src/
  components/
  data/
  pages/
  services/
  types.ts
  App.tsx
  main.tsx
```

## Publicação e limitações conhecidas

Configure o host para servir `index.html` em rotas SPA, use a implantação demo separada da implantação de produção e defina `VITE_APP_MODE=supabase` no ambiente real. Antes da publicação, valide as policies em uma sessão anônima, em uma conta autenticada sem autorização e na conta administradora.

O repositório, o calendário público e o painel já compartilham eventos por ambiente. A edição de eventos está disponível. Ainda não há gerenciamento de atividades culturais, avisos ou livros, nem gestão de exceções recorrentes por data. As mudanças feitas por outra sessão Supabase são atualizadas ao focar a janela ou recarregar; Realtime remoto ainda não está integrado.
