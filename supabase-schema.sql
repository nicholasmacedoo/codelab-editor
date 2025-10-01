-- Schema para o Editor de JavaScript
-- Execute este script no SQL Editor do Supabase

-- Tabela de projetos
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  slug text unique not null,
  title text not null,
  code text not null,
  visibility text not null default 'unlisted' check (visibility in ('public', 'unlisted', 'private')),
  allow_edits boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela de versões dos projetos
create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text, -- ex.: "Checkpoint 1" (opcional)
  code text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Índices para performance
create index idx_projects_slug on public.projects(slug);
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_visibility on public.projects(visibility);
create index idx_projects_updated_at on public.projects(updated_at desc);
create index idx_project_versions_project_id on public.project_versions(project_id);
create index idx_project_versions_created_at on public.project_versions(created_at desc);

-- Função para atualizar updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para atualizar updated_at na tabela projects
create trigger update_projects_updated_at
  before update on public.projects
  for each row
  execute function update_updated_at_column();

-- RLS (Row Level Security) Policies
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;

-- Políticas para projetos
-- Qualquer pessoa pode ver projetos públicos
create policy "Projetos públicos são visíveis para todos"
  on public.projects for select
  using (visibility = 'public');

-- Usuários autenticados podem ver projetos unlisted se tiverem o link
create policy "Projetos unlisted são visíveis para usuários autenticados"
  on public.projects for select
  using (visibility = 'unlisted' and auth.role() = 'authenticated');

-- Usuários podem ver seus próprios projetos privados
create policy "Usuários podem ver seus próprios projetos"
  on public.projects for select
  using (auth.uid() = user_id);

-- Usuários podem inserir seus próprios projetos
create policy "Usuários podem criar projetos"
  on public.projects for insert
  with check (auth.uid() = user_id);

-- Permitir criação de projetos anônimos (user_id = null)
create policy "Permitir criação de projetos anônimos"
  on public.projects for insert
  with check (user_id is null);

-- Usuários podem atualizar seus próprios projetos
create policy "Usuários podem atualizar seus próprios projetos"
  on public.projects for update
  using (auth.uid() = user_id);

-- Usuários podem deletar seus próprios projetos
create policy "Usuários podem deletar seus próprios projetos"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Políticas para versões de projetos
-- Usuários podem ver versões de projetos que eles podem ver
create policy "Versões visíveis baseadas no projeto"
  on public.project_versions for select
  using (
    exists (
      select 1 from public.projects 
      where id = project_versions.project_id 
      and (
        visibility = 'public' 
        or (visibility = 'unlisted' and auth.role() = 'authenticated')
        or (auth.uid() = user_id)
      )
    )
  );

-- Usuários podem criar versões de projetos que possuem
create policy "Usuários podem criar versões de seus projetos"
  on public.project_versions for insert
  with check (
    exists (
      select 1 from public.projects 
      where id = project_versions.project_id 
      and auth.uid() = user_id
    )
  );

-- Usuários podem deletar versões de projetos que possuem
create policy "Usuários podem deletar versões de seus projetos"
  on public.project_versions for delete
  using (
    exists (
      select 1 from public.projects 
      where id = project_versions.project_id 
      and auth.uid() = user_id
    )
  );

-- Função para gerar slug único
create or replace function generate_unique_slug(base_title text)
returns text as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  -- Converter título para slug
  base_slug := lower(trim(regexp_replace(base_title, '[^a-zA-Z0-9\s]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  -- Se o slug estiver vazio, usar um padrão
  if base_slug = '' then
    base_slug := 'projeto';
  end if;
  
  final_slug := base_slug;
  
  -- Verificar se o slug já existe e adicionar número se necessário
  while exists (select 1 from public.projects where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  
  return final_slug;
end;
$$ language plpgsql;

-- Função para broadcast de mudanças em tempo real
create or replace function broadcast_project_change()
returns trigger as $$
begin
  -- Enviar notificação para o canal do projeto
  perform pg_notify(
    'project_' || coalesce(new.id::text, old.id::text),
    json_build_object(
      'type', TG_OP,
      'project_id', coalesce(new.id, old.id),
      'data', case when TG_OP = 'DELETE' then null else row_to_json(new) end
    )::text
  );
  
  return coalesce(new, old);
end;
$$ language plpgsql;

-- Triggers para broadcast
create trigger project_change_trigger
  after insert or update or delete on public.projects
  for each row execute function broadcast_project_change();

-- Comentários para documentação
comment on table public.projects is 'Tabela principal de projetos JavaScript';
comment on table public.project_versions is 'Versões salvas dos projetos (save points)';
comment on column public.projects.visibility is 'Visibilidade: public (link aberto), unlisted (link secreto), private (somente dono)';
comment on column public.projects.allow_edits is 'Permite edição colaborativa para projetos públicos/unlisted';
comment on column public.project_versions.label is 'Nome opcional da versão (ex: "Checkpoint 1")';

-- Inserir projeto de exemplo (opcional)
insert into public.projects (slug, title, code, visibility, allow_edits, user_id)
values (
  'exemplo-hello-world',
  'Exemplo: Hello World',
  'console.log("Olá, mundo!");
console.log("Bem-vindo ao Editor JavaScript!");

// Exemplo de função
function somar(a, b) {
  return a + b;
}

console.log("2 + 3 =", somar(2, 3));',
  'public',
  false,
  null
);