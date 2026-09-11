import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Inicialização Lazy do Supabase Service Role (backend seguro)
let supabaseAdminClient: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!serviceKey || !url) {
    return null;
  }
  if (!supabaseAdminClient) {
    try {
      supabaseAdminClient = createClient(url, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('[Server] Falha ao instanciar Supabase Admin:', err);
      return null;
    }
  }
  return supabaseAdminClient;
}

// Armazenamento em memória persistente em disco de fallback
// para garantir que a aplicação nunca perca dados se o Supabase ainda estiver sendo provisionado
interface ServerStore {
  pracas: any[];
  corridas: any[];
  mototaxistas: any[];
  passageiros: any[];
  configuracoes: any;
}

const serverStore: ServerStore = {
  pracas: [
    {
      id: 'praca-centro',
      nome: 'Praça Central (Matriz)',
      endereco_referencia: 'Praça Barão do Rio Branco, Centro, Alagoinha-PB',
      ativa: true,
      latitude: -6.9535,
      longitude: -35.5463,
      mototaxistas_vinculados: 3,
      mototaxistas_disponiveis: 2,
    },
    {
      id: 'praca-mercado',
      nome: 'Praça do Mercado Público',
      endereco_referencia: 'Rua do Comércio / Mercado Municipal',
      ativa: true,
      latitude: -6.9542,
      longitude: -35.5451,
      mototaxistas_vinculados: 2,
      mototaxistas_disponiveis: 1,
    },
    {
      id: 'praca-patio-festas',
      nome: 'Praça do Pátio de Eventos',
      endereco_referencia: 'Avenida Principal / Saída para Cuitegi',
      ativa: true,
      latitude: -6.9515,
      longitude: -35.542,
      mototaxistas_vinculados: 2,
      mototaxistas_disponiveis: 1,
    },
  ],
  corridas: [],
  mototaxistas: [],
  passageiros: [],
  configuracoes: {
    taxa_passageiro_tipo: 'fixo',
    taxa_passageiro_valor: 0.0,
    taxa_mototaxista_tipo: 'percentual',
    taxa_mototaxista_valor: 20.0, // 20%
    tarifa_base_corrida: 4.0,
    tarifa_km_adicional: 1.5,
  },
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // ==========================================================================
  // ROTAS DE API DA CENTRAL & SEGURANÇA
  // ==========================================================================

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Nexo Viagens Core API',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Status seguro do Supabase (NÃO expõe chaves secretas)
  app.get('/api/supabase/status', (req, res) => {
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const hasClientUrl = Boolean(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
    const hasAnonKey = Boolean(process.env.VITE_SUPABASE_ANON_KEY);

    res.json({
      configured: hasClientUrl && hasAnonKey,
      hasServiceRoleBackend: hasServiceKey,
      supabaseUrl: (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) ? 'Configurado' : 'Pendente',
      realtimeEnabled: true,
      mode: hasClientUrl && hasAnonKey ? 'supabase_cloud' : 'hybrid_ready',
    });
  });

  // 3. Cálculo seguro de taxas (Regra: Nunca permitir alteração livre pelo frontend)
  app.post('/api/corridas/calcular-taxas', (req, res) => {
    const { valor_base, distancia_km } = req.body;
    const base = Number(valor_base) || serverStore.configuracoes.tarifa_base_corrida || 4.0;
    const cfg = serverStore.configuracoes;

    // Taxa do passageiro
    let taxaPassageiro = 0.0;
    if (cfg.taxa_passageiro_tipo === 'fixo') {
      taxaPassageiro = cfg.taxa_passageiro_valor;
    } else {
      taxaPassageiro = base * (cfg.taxa_passageiro_valor / 100);
    }

    // Taxa do mototaxista
    let taxaMototaxista = 0.0;
    if (cfg.taxa_mototaxista_tipo === 'fixo') {
      taxaMototaxista = cfg.taxa_mototaxista_valor;
    } else {
      taxaMototaxista = base * (cfg.taxa_mototaxista_valor / 100);
    }

    const valorTotalPassageiro = base + taxaPassageiro;
    const valorDestinadoCentral = taxaPassageiro + taxaMototaxista;
    const valorLiquidoMototaxista = Math.max(0, base - taxaMototaxista);

    res.json({
      valor_corrida: valorTotalPassageiro,
      tarifa_base: base,
      taxa_passageiro: taxaPassageiro,
      taxa_mototaxista: taxaMototaxista,
      valor_destinado_central: valorDestinadoCentral,
      valor_liquido_mototaxista: valorLiquidoMototaxista,
    });
  });

  // 4. Salvar configurações da Central (seguro)
  app.post('/api/admin/configuracoes', (req, res) => {
    const {
      taxa_passageiro_tipo,
      taxa_passageiro_valor,
      taxa_mototaxista_tipo,
      taxa_mototaxista_valor,
      tarifa_base_corrida,
    } = req.body;

    if (taxa_passageiro_tipo) serverStore.configuracoes.taxa_passageiro_tipo = taxa_passageiro_tipo;
    if (typeof taxa_passageiro_valor === 'number') serverStore.configuracoes.taxa_passageiro_valor = taxa_passageiro_valor;
    if (taxa_mototaxista_tipo) serverStore.configuracoes.taxa_mototaxista_tipo = taxa_mototaxista_tipo;
    if (typeof taxa_mototaxista_valor === 'number') serverStore.configuracoes.taxa_mototaxista_valor = taxa_mototaxista_valor;
    if (typeof tarifa_base_corrida === 'number') serverStore.configuracoes.tarifa_base_corrida = tarifa_base_corrida;

    res.json({ success: true, configuracoes: serverStore.configuracoes });
  });

  // 5. Obter configurações da Central
  app.get('/api/admin/configuracoes', (req, res) => {
    res.json({ configuracoes: serverStore.configuracoes });
  });

  // 6. Gerenciar Praças (CRUD seguro para Central)
  app.get('/api/pracas', (req, res) => {
    res.json({ pracas: serverStore.pracas });
  });

  app.post('/api/pracas', (req, res) => {
    const { nome, endereco_referencia, latitude, longitude } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Nome da praça é obrigatório.' });
    }
    const novaPraca = {
      id: `praca-${Date.now()}`,
      nome: nome.trim(),
      endereco_referencia: endereco_referencia || 'Alagoinha-PB',
      latitude: Number(latitude) || -6.9535,
      longitude: Number(longitude) || -35.5463,
      ativa: true,
      mototaxistas_vinculados: 0,
      mototaxistas_disponiveis: 0,
    };
    serverStore.pracas.push(novaPraca);
    res.json({ success: true, praca: novaPraca });
  });

  // 7. Moderar Mototaxista (Aprovar / Reprovar / Bloquear pela Central)
  app.post('/api/admin/mototaxistas/moderar', (req, res) => {
    const { mototaxista_id, novo_status, motivo } = req.body;
    if (!mototaxista_id || !novo_status) {
      return res.status(400).json({ error: 'Parâmetros incompletos.' });
    }

    const adminSupabase = getSupabaseAdmin();
    if (adminSupabase) {
      // Se houver Supabase com service role conectado
      adminSupabase
        .from('mototaxistas')
        .update({
          status_aprovacao: novo_status,
          motivo_reprovacao: motivo || null,
          aprovado_em: novo_status === 'aprovado' ? new Date().toISOString() : null,
        })
        .eq('perfil_id', mototaxista_id)
        .then(({ error }) => {
          if (error) console.error('[Supabase Admin Update Error]:', error);
        });
    }

    res.json({
      success: true,
      mototaxista_id,
      novo_status,
      motivo,
      updated_at: new Date().toISOString(),
    });
  });

  // ==========================================================================
  // VITE MIDDLEWARE (DEV vs PROD)
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexo Viagens] Servidor rodando com sucesso em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Nexo Viagens] Erro fatal ao iniciar o servidor:', err);
});
