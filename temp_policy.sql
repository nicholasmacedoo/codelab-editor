-- Permitir criação de projetos anônimos (user_id = null)
create policy "Permitir criação de projetos anônimos"
  on public.projects for insert
  with check (user_id is null);
