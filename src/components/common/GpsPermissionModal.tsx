import React, { useState, useEffect } from 'react';
import { Navigation, AlertTriangle, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

interface GpsPermissionModalProps {
  tipoUsuario?: 'passageiro' | 'mototaxista';
  onPermitido?: (coords: { lat: number; lng: number; accuracy: number }) => void;
  onIgnorar?: () => void;
}

export const GpsPermissionModal: React.FC<GpsPermissionModalProps> = ({
  tipoUsuario = 'mototaxista',
  onPermitido,
  onIgnorar,
}) => {
  const [solicitando, setSolicitando] = useState(false);
  const [statusPermissao, setStatusPermissao] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    // Verifica status da permissão na Permissions API (se suportado pelo navegador)
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          setStatusPermissao(perm.state as any);
          if (perm.state === 'prompt') {
            // Se ainda não foi solicitado ou autorizado, exibe o modal explicativo
            const dispensadoAntes = sessionStorage.getItem('nexo_gps_modal_dispensado');
            if (!dispensadoAntes) {
              setVisivel(true);
            }
          } else if (perm.state === 'granted') {
            setVisivel(false);
          }
          perm.onchange = () => {
            setStatusPermissao(perm.state as any);
            if (perm.state === 'granted') {
              setVisivel(false);
            }
          };
        })
        .catch(() => {
          // Fallback se query de permissão falhar
          const dispensadoAntes = sessionStorage.getItem('nexo_gps_modal_dispensado');
          if (!dispensadoAntes) setVisivel(true);
        });
    } else {
      const dispensadoAntes = sessionStorage.getItem('nexo_gps_modal_dispensado');
      if (!dispensadoAntes) setVisivel(true);
    }
  }, []);

  const handlePedirPermissao = () => {
    if (!navigator.geolocation) {
      setErroMsg('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setSolicitando(true);
    setErroMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSolicitando(false);
        setStatusPermissao('granted');
        setVisivel(false);
        if (onPermitido) {
          onPermitido({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        }
      },
      (err) => {
        setSolicitando(false);
        if (err.code === err.PERMISSION_DENIED) {
          setStatusPermissao('denied');
          setErroMsg(
            'Permissão negada. Para ativar, toque no ícone de cadeado na barra de endereços do seu navegador e permita o acesso ao Local/GPS.'
          );
        } else {
          setErroMsg('Sinal de GPS fraco ou indisponível no momento. Tente ir para um local aberto.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  };

  const handleDispensar = () => {
    sessionStorage.setItem('nexo_gps_modal_dispensado', 'true');
    setVisivel(false);
    if (onIgnorar) onIgnorar();
  };

  if (!visivel || statusPermissao === 'granted') {
    return null;
  }

  const isPiloto = tipoUsuario === 'mototaxista';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/50 p-6 sm:p-7 shadow-2xl space-y-5 text-white relative overflow-hidden">
        {/* Radar animado no topo */}
        <div className="flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <span className="w-20 h-20 rounded-full bg-cyan-500/20 animate-ping absolute" />
            <span className="w-16 h-16 rounded-full bg-cyan-500/30 flex items-center justify-center relative border border-cyan-400/50 text-cyan-300">
              <Navigation className="w-8 h-8 text-cyan-400 rotate-45" />
            </span>
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Navegação & Rastreio Alagoinha</span>
          </div>
          <h3 className="text-xl font-black text-white">
            {isPiloto ? 'Ativar GPS em Tempo Real para Corridas' : 'Ativar Localização para Pedir Viagens'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {isPiloto
              ? 'O app precisa da sua localização para o Guia Azul, detecção automática de chegada no embarque e cálculo de distância.'
              : 'Precisamos do GPS para preencher seu local de partida com precisão e mostrar a moto do piloto chegando até você.'}
          </p>
        </div>

        {/* Vantagens em bullet points */}
        <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Detecção automática sem precisar apertar botões na moto</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Traçado Guia Azul em tempo real no mapa</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Privacidade total: coordenadas só trafegam durante a corrida</span>
          </div>
        </div>

        {erroMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{erroMsg}</p>
          </div>
        )}

        {/* Botão de Ativação Gigante */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handlePedirPermissao}
            disabled={solicitando}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/50 cursor-pointer transform active:scale-98 transition-all disabled:opacity-50"
          >
            {solicitando ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Ativando Satélites GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 text-slate-950 rotate-45" />
                <span>Permitir Acesso ao GPS de Alta Precisão</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDispensar}
            className="w-full py-2.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Lembrar mais tarde (continuar sem GPS nativo)
          </button>
        </div>
      </div>
    </div>
  );
};
