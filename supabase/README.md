# Supabase setup

1. Crie um projeto no Supabase.
2. Rode o SQL em `schema.sql` para criar as tabelas e políticas.
3. Defina `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_ADMIN_EMAILS` no `.env`.
4. Crie os usuários no Supabase Auth e adicione os e-mails permitidos na variável `VITE_ADMIN_EMAILS`.
5. Publique os registros desejados e mantenha somente itens com `published = true` acessíveis publicamente.
