-- ============================================================================
-- NEXO VIAGENS - SCHEMA COMPLETO PARA SUPABASE (ALAGOINHA-PB)
-- Compatível com o Plano Gratuito do Supabase (PostgreSQL + RLS + Realtime)
-- ============================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Praças / Pontos de Moto
CREATE TABLE IF NOT EXISTS public.pracas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco_referencia TEXT NOT NULL,
  ativa BOOLEAN DEFAULT true,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  mototaxistas_vinculados INT DEFAULT 0,
  mototaxistas_disponiveis INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Mototaxistas
CREATE TABLE IF NOT EXISTS public.mototaxistas (
  id TEXT PRIMARY KEY,
  perfil_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'aprovado',
  is_online BOOLEAN DEFAULT false,
  assigned_zone_id TEXT REFERENCES public.pracas(id),
  total_deliveries INT DEFAULT 0,
  rating DOUBLE PRECISION DEFAULT 5.0,
  daily_earnings DOUBLE PRECISION DEFAULT 0.0,
  accumulated_fees DOUBLE PRECISION DEFAULT 0.0,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Corridas / Viagens
CREATE TABLE IF NOT EXISTS public.corridas (
  id TEXT PRIMARY KEY,
  codigo_corrida TEXT NOT NULL UNIQUE,
  passageiro_id TEXT NOT NULL,
  passageiro_nome TEXT NOT NULL,
  passageiro_telefone TEXT,
  mototaxista_id TEXT REFERENCES public.mototaxistas(id),
  mototaxista_nome TEXT,
  mototaxista_telefone TEXT,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  origem_latitude DOUBLE PRECISION,
  origem_longitude DOUBLE PRECISION,
  destino_latitude DOUBLE PRECISION,
  destino_longitude DOUBLE PRECISION,
  current_courier_lat DOUBLE PRECISION,
  current_courier_lng DOUBLE PRECISION,
  distance_to_passenger_meters INT,
  distance_to_destination_meters INT,
  estimated_arrival_minutes INT,
  estimated_distance_km DOUBLE PRECISION DEFAULT 1.5,
  estimated_minutes INT DEFAULT 5,
  fee DOUBLE PRECISION NOT NULL,
  payment_method TEXT DEFAULT 'saldo_central',
  status TEXT NOT NULL DEFAULT 'aguardando_entregador',
  pin_code TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Configurações da Central
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id TEXT PRIMARY KEY DEFAULT 'central_config',
  taxa_passageiro_tipo TEXT DEFAULT 'fixo',
  taxa_passageiro_valor DOUBLE PRECISION DEFAULT 0.0,
  taxa_mototaxista_tipo TEXT DEFAULT 'percentual',
  taxa_mototaxista_valor DOUBLE PRECISION DEFAULT 20.0,
  tarifa_base_corrida DOUBLE PRECISION DEFAULT 4.0,
  tarifa_km_adicional DOUBLE PRECISION DEFAULT 1.5,
  chave_pix TEXT DEFAULT 'nexo.alagoinha@pix.com.br',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ATIVAR REALTIME NAS TABELAS
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.corridas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mototaxistas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pracas;

-- ============================================================================
-- DADOS INICIAIS (SEED) PARA ALAGOINHA-PB
-- ============================================================================
INSERT INTO public.pracas (id, nome, endereco_referencia, ativa, latitude, longitude, mototaxistas_vinculados, mototaxistas_disponiveis)
VALUES 
  ('praca-centro', 'Praça Central (Matriz)', 'Praça Barão do Rio Branco, Centro, Alagoinha-PB', true, -6.9535, -35.5463, 3, 2),
  ('praca-mercado', 'Praça do Mercado Público', 'Rua do Comércio / Mercado Municipal', true, -6.9542, -35.5451, 2, 1),
  ('praca-patio-festas', 'Praça do Pátio de Eventos', 'Avenida Principal / Saída para Cuitegi', true, -6.9515, -35.5420, 2, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.configuracoes (id, taxa_passageiro_tipo, taxa_passageiro_valor, taxa_mototaxista_tipo, taxa_mototaxista_valor, tarifa_base_corrida, tarifa_km_adicional, chave_pix)
VALUES ('central_config', 'fixo', 0.0, 'percentual', 20.0, 4.0, 1.5, 'nexo.alagoinha@pix.com.br')
ON CONFLICT (id) DO NOTHING;
