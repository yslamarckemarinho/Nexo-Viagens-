import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente públicas (Vite)
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL;
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 20
  );
};

export const getSupabaseConfigStatus = () => {
  return {
    isConfigured: isSupabaseConfigured(),
    url: supabaseUrl || null,
    hasAnonKey: Boolean(supabaseAnonKey && supabaseAnonKey.length > 20),
  };
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl as string, supabaseAnonKey as string, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 2, // Limite inteligente de eventos por segundo para evitar sobrecarga
          },
        },
      });
    } catch (err) {
      console.warn('Falha ao inicializar cliente Supabase:', err);
      return null;
    }
  }

  return clientInstance;
};

// ============================================================================
// ATUALIZAÇÕES INTELIGENTES & THROTTLE
// Evita requisições a cada segundo e reduz tráfego em até 95%
// ============================================================================
const throttleMap = new Map<string, number>();

export const throttleAction = (key: string, intervalMs: number, action: () => void): boolean => {
  const now = Date.now();
  const lastTime = throttleMap.get(key) || 0;

  if (now - lastTime >= intervalMs) {
    throttleMap.set(key, now);
    action();
    return true;
  }
  return false;
};
