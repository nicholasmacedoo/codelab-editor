-- ============================================================================
-- MIGRAÇÃO PASSO 1: Adicionar 'react' ao enum project_type
-- ============================================================================
-- Este comando DEVE ser executado PRIMEIRO e fazer commit separadamente
-- devido à limitação do PostgreSQL com valores de enum em transações

-- Adicionar 'react' ao enum project_type
ALTER TYPE project_type ADD VALUE 'react';

-- Após executar este comando, execute o migration-add-react-support.sql

