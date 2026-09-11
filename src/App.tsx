import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { PortalSelectScreen } from './components/auth/PortalSelectScreen';
import { MerchantAuthScreen } from './components/auth/MerchantAuthScreen';
import { CourierAuthScreen } from './components/auth/CourierAuthScreen';
import { AdminAuthScreen } from './components/auth/AdminAuthScreen';
import { AdminPortal } from './components/admin/AdminPortal';
import { MerchantPortal } from './components/merchant/MerchantPortal';
import { CourierPortal } from './components/courier/CourierPortal';
import { PublicRideTracking } from './components/common/PublicRideTracking';

const MainLayout: React.FC = () => {
  const { session, settings, obterCorridaPorCodigo } = useApp();
  const [selectedAuthPortal, setSelectedAuthPortal] = useState<'merchant' | 'courier' | 'admin' | null>(null);
  const [publicTrackingCode, setPublicTrackingCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('rastreio');
  });

  useEffect(() => {
    const checkParams = () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('rastreio');
      if (code) setPublicTrackingCode(code);
    };
    window.addEventListener('popstate', checkParams);
    return () => window.removeEventListener('popstate', checkParams);
  }, []);

  // Sugestão 1: Rastreio Público da Família (sem necessidade de login)
  if (publicTrackingCode) {
    const delivery = obterCorridaPorCodigo(publicTrackingCode);
    return (
      <PublicRideTracking
        delivery={delivery}
        trackingCode={publicTrackingCode}
        onClose={() => {
          setPublicTrackingCode(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('rastreio');
          window.history.pushState({}, '', url.toString());
        }}
      />
    );
  }

  // If NOT authenticated, show the appropriate authentication / portal select screen
  if (!session.isAuthenticated || !session.role) {
    if (selectedAuthPortal === 'merchant') {
      return <MerchantAuthScreen onBack={() => setSelectedAuthPortal(null)} />;
    }
    if (selectedAuthPortal === 'courier') {
      return <CourierAuthScreen onBack={() => setSelectedAuthPortal(null)} />;
    }
    if (selectedAuthPortal === 'admin') {
      return <AdminAuthScreen onBack={() => setSelectedAuthPortal(null)} />;
    }

    return (
      <PortalSelectScreen
        onSelectPortal={(portal) => setSelectedAuthPortal(portal)}
      />
    );
  }

  // When AUTHENTICATED, show the isolated Portal screen with the Header
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <Header />

      <main className="flex-1 pb-16">
        {session.role === 'admin' && <AdminPortal />}
        {session.role === 'merchant' && <MerchantPortal />}
        {session.role === 'courier' && <CourierPortal />}
      </main>

      {/* Footer info for local platform */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong className="text-slate-300">Nexo Viagens</strong> • Mobilidade e Viagens em {settings.city}
          </span>
          <span className="text-[11px] text-slate-500">
            Metas de R$ {settings.goalAmount.toFixed(2)} • Taxa da Central 30% • Auditoria Financeira Total
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
