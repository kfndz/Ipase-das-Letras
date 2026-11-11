# Status da implementação

Este status descreve o código no workspace. “Testado” significa somente que os testes automatizados listados foram executados; não implica implantação ou validação em um projeto Supabase real.

## Implementado e testado

- Seleção coerente dos modos demo e Supabase, sem alternância automática de produção para demo após falha.
- Repositório único de eventos para início, calendário e painel; alterações demo são notificadas no mesmo navegador e persistem em `localStorage`.
- Criação, edição, publicação, despublicação e cancelamento de eventos no painel demo; eventos publicados aparecem no calendário e na lista pública de próximos encontros.
- Restauração dos eventos iniciais demonstrativos.
- Geração de ocorrências de terça e quinta com horário local 19h–21h, incluindo virada de ano e cálculo de data/hora em `America/Cuiaba`.
- Exibição de eventos cancelados no calendário, exclusão de cancelados/rascunhos da lista de próximos encontros e resumo limitado ao mês selecionado.
- Testes automatizados para login demo, isolamento, persistência local, atualização do calendário, intervalo multi-dia, datas na virada do ano, cancelamentos, falhas de consulta Supabase simuladas, navegação mobile e estado vazio.

## Implementado, dependente de configuração

- Login de produção pelo Supabase Auth e verificação de autorização usando a função SQL `public.is_admin()`.
- Leitura, gravação e exclusão de eventos publicados no Supabase, com erros propagados para a interface.
- Schema SQL idempotente para tabelas e políticas RLS; políticas administrativas consultam uma tabela privada `admin_users`.
- Aplicação real do SQL, configuração de Auth, criação da primeira administradora e validação em projeto Supabase ainda dependem de configuração externa e não foram executadas neste workspace.
- Persistência de eventos no PostgreSQL depende de Supabase configurado; os testes presentes mockam a falha de consulta e não provam persistência em ambiente real.

## Somente demonstração

- Credenciais simples de protótipo e botão “Entrar na demonstração”. Não são autenticação segura e não concedem permissões ao Supabase.
- Eventos demonstrativos locais, armazenamento isolado no navegador e restauração dos seeds.
- Cadastro e manutenção de eventos disponíveis apenas no modo demo quando Supabase não está configurado.

## Pendente

- Gerenciar recorrência e exceções por ocorrência no banco; a demonstração representa a rotina como ocorrências locais individuais.
- Sincronização Supabase em tempo real entre sessões; as páginas atualizam após operações do próprio cliente e quando a janela recupera foco.
- CRUD de atividades culturais, avisos e catálogo literário, incluindo páginas públicas e estados vazios correspondentes.
- Teste de autenticação, autorização e RLS contra projeto Supabase real, incluindo usuário autenticado não administrador.
- Testes de falha de gravação/exclusão Supabase, publicação persistida, atualização entre dispositivos e reautorização após expiração de sessão.
- Revisão de acessibilidade com usuários e validação de usabilidade com a responsável/comunidade.
- Configuração e teste do fallback de rotas SPA no host de publicação.

## Verificações automatizadas executadas

- `npm run build` — aprovado.
- `npm run lint` — aprovado sem avisos na última execução.
- `npm test` — 19 testes aprovados em 4 arquivos na última execução.
