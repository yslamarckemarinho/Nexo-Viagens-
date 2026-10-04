import React, { useState, useEffect, useMemo } from 'react';
import { Delivery } from '../../types';
import {
  Navigation,
  MapPin,
  Route,
  Volume2,
  Compass,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Bike,
  ExternalLink,
  LocateFixed,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { generateMapsNavigationUrl, generateWazeNavigationUrl } from '../../utils/whatsapp';
import { calcularDistanciaMetros, estimarTempoChegadaMinutos, PONTOS_REFERENCIA_ALAGOINHA } from '../../utils/geofencing';
import { tocarChimeChegada } from '../../utils/notifications';

interface RouteNavigationMapProps {
  delivery: Delivery;
  courierLat?: number;
  courierLng?: number;
  courierHeading?: number;
  courierSpeed?: number;
  highContrastMode?: boolean;
  readOnly?: boolean;
  onChegouEmbarque?: () => void;
  onChegouDestino?: () => void;
  onIniciarViagem?: () => void;
  onAbrirPinModal?: () => void;
}

export const RouteNavigationMap: React.FC<RouteNavigationMapProps> = ({
  delivery,
  courierLat,
  courierLng,
  courierHeading = 0,
  courierSpeed = 0,
  highContrastMode = false,
  readOnly = false,
  onChegouEmbarque,
  onChegouDestino,
  onIniciarViagem,
  onAbrirPinModal,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [autoNotifiedPickup, setAutoNotifiedPickup] = useState(false);
  const [autoNotifiedDropoff, setAutoNotifiedDropoff] = useState(false);

  // Determina a fase da viagem:
  // Fase 1: A caminho do embarque do passageiro
  // Fase 2: Com o passageiro na moto a caminho do destino
  const isPickupPhase =
    delivery.status === 'entregador_aceitou' ||
    delivery.status === 'a_caminho_coleta' ||
    delivery.status === 'aguardando_entregador' ||
    delivery.status === 'solicitada';

  // Coordenadas padrão de Alagoinha-PB caso não haja GPS ainda
  const defaultCenter = { lat: -6.9535, lng: -35.5463 };

  const currentLat = courierLat || delivery.currentCourierLat || defaultCenter.lat;
  const currentLng = courierLng || delivery.currentCourierLng || defaultCenter.lng;

  // Alvo atual (Embarque ou Destino)
  const targetLat = isPickupPhase
    ? delivery.origem_latitude || delivery.passengerLat || defaultCenter.lat + 0.0025
    : delivery.destino_latitude || defaultCenter.lat - 0.0035;

  const targetLng = isPickupPhase
    ? delivery.origem_longitude || delivery.passengerLng || defaultCenter.lng - 0.002
    : delivery.destino_longitude || defaultCenter.lng + 0.003;

  const targetAddress = isPickupPhase ? delivery.pickupAddress : delivery.deliveryAddress;
  const targetLabel = isPickupPhase ? 'Ponto de Embarque' : 'Destino Final';

  // Distância calculada em tempo real (GPS local)
  const distanceMeters = useMemo(() => {
    return Math.round(calcularDistanciaMetros(currentLat, currentLng, targetLat, targetLng));
  }, [currentLat, currentLng, targetLat, targetLng]);

  const etaMinutes = useMemo(() => {
    return estimarTempoChegadaMinutos(distanceMeters, 25);
  }, [distanceMeters]);

  // Detecção Automática de Chegada via GPS (< 65 metros para embarque, < 60 metros para destino)
  const chegadoNoAlvo = distanceMeters <= (isPickupPhase ? 65 : 60);

  useEffect(() => {
    if (chegadoNoAlvo && !readOnly) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([250, 100, 250, 100, 300]);
        } catch {}
      }

      tocarChimeChegada();

      if (isPickupPhase && !autoNotifiedPickup) {
        setAutoNotifiedPickup(true);
        if (onChegouEmbarque) onChegouEmbarque();
      } else if (!isPickupPhase && !autoNotifiedDropoff) {
        setAutoNotifiedDropoff(true);
        if (onChegouDestino) onChegouDestino();
      }
    }
  }, [chegadoNoAlvo, readOnly, isPickupPhase, autoNotifiedPickup, autoNotifiedDropoff, onChegouEmbarque, onChegouDestino]);

  // URLs nativas de navegação por voz de 1 toque (Sugestão C Híbrida)
  const googleMapsVoiceUrl = generateMapsNavigationUrl(targetAddress, targetLat, targetLng);
  const wazeVoiceUrl = generateWazeNavigationUrl(targetAddress, targetLat, targetLng);

  // Projeção do mapa em SVG (Normalização para o canvas 500x320)
  // Define bounding box dinâmico para incluir moto e destino com margem
  const mapBounds = useMemo(() => {
    const minLat = Math.min(currentLat, targetLat) - 0.002;
    const maxLat = Math.max(currentLat, targetLat) + 0.002;
    const minLng = Math.min(currentLng, targetLng) - 0.002;
    const maxLng = Math.max(currentLng, targetLng) + 0.002;

    const latSpan = Math.max(0.004, maxLat - minLat);
    const lngSpan = Math.max(0.004, maxLng - minLng);

    return { minLat, maxLat, minLng, maxLng, latSpan, lngSpan };
  }, [currentLat, targetLat, currentLng, targetLng]);

  // Converte Latitude/Longitude em X, Y do SVG (500x320)
  const toSvgCoords = (lat: number, lng: number) => {
    const padding = 55;
    const width = 500 - padding * 2;
    const height = 320 - padding * 2;

    const x = padding + ((lng - mapBounds.minLng) / mapBounds.latSpan) * width;
    // Inverte Y porque latitude aumenta para o norte (topo)
    const y = 320 - (padding + ((lat - mapBounds.minLat) / mapBounds.latSpan) * height);

    return {
      x: Math.max(30, Math.min(470, x)),
      y: Math.max(30, Math.min(290, y)),
    };
  };

  const motoCoords = toSvgCoords(currentLat, currentLng);
  const targetCoords = toSvgCoords(targetLat, targetLng);

  // Gera pontos intermediários para desenhar a curva realista da rota ("Guia Azul")
  // Simulando traçado de ruas em Alagoinha em direção ao ponto
  const midX = (motoCoords.x + targetCoords.x) / 2;
  const midY = (motoCoords.y + targetCoords.y) / 2;
  // Curvatura leve de rua
  const curveDx = (targetCoords.y - motoCoords.y) * 0.15;
  const curveDy = (motoCoords.x - targetCoords.x) * 0.15;
  const waypointX = midX + curveDx;
  const waypointY = midY + curveDy;

  const routePathD = `M ${motoCoords.x} ${motoCoords.y} Q ${waypointX} ${waypointY} ${targetCoords.x} ${targetCoords.y}`;

  // Lista de referências visuais de ruas em Alagoinha projetadas no mapa
  const landmarksProjected = useMemo(() => {
    return PONTOS_REFERENCIA_ALAGOINHA.slice(0, 6).map((ponto) => {
      const coords = toSvgCoords(ponto.lat, ponto.lon);
      return {
        id: ponto.id,
        nome: ponto.nome,
        bairro: ponto.bairro,
        x: coords.x,
        y: coords.y,
      };
    });
  }, [mapBounds]);

  return (
    <div
      className={`rounded-3xl border transition-all overflow-hidden shadow-2xl relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 flex flex-col' : 'w-full'
      } ${
        highContrastMode
          ? 'bg-black border-amber-400/60'
          : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-cyan-500/40'
      }`}
    >
      {/* 1. TOPO: SUGESTÃO C - BARRA DE NAVEGAÇÃO HÍBRIDA & VOZ DE 1 TOQUE */}
      <div
        className={`p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          highContrastMode
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-slate-900/90 border-slate-800 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              isPickupPhase
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
            }`}
          >
            {isPickupPhase ? <MapPin className="w-5 h-5 animate-bounce" /> : <Flag className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isPickupPhase
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isPickupPhase ? 'FASE 1: INDO BUSCAR' : 'FASE 2: INDO AO DESTINO'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {delivery.code} • {isPickupPhase ? 'Embarque' : 'Desembarque'}
              </span>
            </div>
            <p className="font-bold text-white text-xs sm:text-sm truncate max-w-sm mt-0.5">
              {targetAddress}
            </p>
          </div>
        </div>

        {/* BOTÕES DE NAVEGAÇÃO POR VOZ (GOOGLE MAPS & WAZE DE 1 TOQUE) */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <a
            href={googleMapsVoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/30 transition-all transform active:scale-95 cursor-pointer"
            title="Abrir no Google Maps oficial com instruções de voz no capacete"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Navegar Voz (Maps)</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          <a
            href={wazeVoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
            title="Abrir no Waze oficial com alertas de trânsito"
          >
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            <span>Waze</span>
          </a>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title={isFullscreen ? 'Reduzir Mapa' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. CORPO DO MAPA: GUIA AZUL VETORIAL INTERATIVO (ALAGOINHA-PB) */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[260px] sm:min-h-[300px] overflow-hidden select-none bg-[#090d16]">
        {/* Camada Estilizada do Mapa da Cidade de Alagoinha */}
        <svg
          viewBox="0 0 500 320"
          className="w-full h-full object-cover pointer-events-none transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Gradiente do Guia Azul Elétrico */}
            <linearGradient id="blueGuideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="1" />
            </linearGradient>

            {/* Brilho Neon para o Guia Azul */}
            <filter id="blueNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E5FF" floodOpacity="0.8" />
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#FFFFFF" floodOpacity="0.9" />
            </filter>

            {/* Padrão da Malha Urbana de Alagoinha */}
            <pattern id="streetGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeOpacity="0.6" />
            </pattern>
          </defs>

          {/* Fundo com malha quadriculada de ruas */}
          <rect width="500" height="320" fill="#090d16" />
          <rect width="500" height="320" fill="url(#streetGrid)" />

          {/* Vias Principais de Alagoinha (Cuitegi/Guarabira/Centro) */}
          <g stroke="#334155" strokeWidth="3" strokeLinecap="round" opacity="0.45">
            {/* Rodovia PB de Acesso */}
            <path d="M 10 280 C 120 250, 240 220, 310 160 S 420 80, 490 50" />
            {/* Avenida Principal Barão do Rio Branco */}
            <path d="M 150 40 L 260 170 L 390 290" />
            {/* Cruzamento São José / Rua Nova */}
            <path d="M 50 140 Q 250 160 450 190" />
          </g>

          {/* Pontos de Referência Notáveis de Alagoinha */}
          {landmarksProjected.map((landmark) => (
            <g key={landmark.id} opacity="0.65">
              <circle cx={landmark.x} cy={landmark.y} r="3" fill="#64748b" />
              <text
                x={landmark.x + 6}
                y={landmark.y + 3}
                fill="#94a3b8"
                fontSize="7.5"
                fontFamily="sans-serif"
                fontWeight="500"
              >
                {landmark.nome.split('(')[0]}
              </text>
            </g>
          ))}

          {/* ⚡ O GUIA AZUL (LINHA DE NAVEGAÇÃO EM NEON AZUL) */}
          <g filter="url(#blueNeonGlow)">
            {/* Linha de sombra / difusão */}
            <path
              d={routePathD}
              fill="none"
              stroke="#0284c7"
              strokeWidth="9"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
            {/* Linha principal azul elétrico */}
            <path
              d={routePathD}
              fill="none"
              stroke="url(#blueGuideGrad)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Traço animado interno pulsante */}
            <path
              d={routePathD}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray="6 12"
              className="animate-[dash_1.5s_linear_infinite]"
            />
          </g>

          {/* MARCADOR DO ALVO (EMBARQUE OU DESTINO) */}
          <g transform={`translate(${targetCoords.x}, ${targetCoords.y})`}>
            {/* Ondas de radar / sonar pulsante no alvo */}
            <circle cx="0" cy="0" r="14" fill={isPickupPhase ? '#06b6d4' : '#10b981'} opacity="0.25" className="animate-ping" />
            <circle cx="0" cy="0" r="8" fill={isPickupPhase ? '#00e5ff' : '#10b981'} opacity="0.5" />
            <circle cx="0" cy="0" r="5" fill="#ffffff" />
            {/* Badge flutuante do alvo */}
            <rect
              x="-45"
              y="-28"
              width="90"
              height="18"
              rx="6"
              fill="#0f172a"
              stroke={isPickupPhase ? '#00e5ff' : '#10b981'}
              strokeWidth="1.2"
            />
            <text
              x="0"
              y="-16"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="7"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {isPickupPhase ? '📍 PONTO EMBARQUE' : '🏁 DESTINO FINAL'}
            </text>
          </g>

          {/* MARCADOR DA MOTO DO PILOTO (COM ROTAÇÃO DE HEADING E SPEED) */}
          <g transform={`translate(${motoCoords.x}, ${motoCoords.y}) rotate(${courierHeading})`}>
            {/* Halo de proteção / localização ativa */}
            <circle cx="0" cy="0" r="18" fill="#38bdf8" opacity="0.2" className="animate-pulse" />
            <circle cx="0" cy="0" r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            {/* Indicador de direção da frente da moto */}
            <polygon points="0,-12 4,-5 -4,-5" fill="#00e5ff" />
          </g>

          {/* Etiqueta fixa da moto acima do marcador */}
          <g transform={`translate(${motoCoords.x}, ${motoCoords.y - 18})`}>
            <rect x="-35" y="-12" width="70" height="14" rx="4" fill="#0284c7" />
            <text
              x="0"
              y="-3"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="7"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              🛵 SUA MOTO
            </text>
          </g>
        </svg>

        {/* OVERLAY: CARD FLUTUANTE DE TELEMETRIA (DISTÂNCIA & TEMPO EM TEMPO REAL) */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              <Compass className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <span className="text-[10px] text-cyan-300 uppercase font-black tracking-wider block">
                {isPickupPhase ? 'Distância até Passageiro' : 'Distância até Destino'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-white">{distanceMeters}m</span>
                <span className="text-xs font-bold text-emerald-400">• ~{etaMinutes} min</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] text-slate-400 uppercase block font-semibold">Velocidade</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {courierSpeed > 0 ? `${courierSpeed} km/h` : 'Em rota'}
            </span>
          </div>
        </div>

        {/* OVERLAY: BOTÕES DE CONTROLE RÁPIDO DO MAPA */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
            className="w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center font-bold text-sm shadow cursor-pointer"
            title="Aproximar Zoom"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
            className="w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center font-bold text-sm shadow cursor-pointer"
            title="Afastar Zoom"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center text-xs shadow cursor-pointer"
            title="Centralizar Rota"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>

        {/* AVISO VISUAL DE CHEGADA AUTOMÁTICA GEOFENCING */}
        {chegadoNoAlvo && (
          <div className="absolute top-3 left-3 right-14 p-2.5 rounded-2xl bg-emerald-500/90 border border-white text-slate-950 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 animate-bounce">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider block">
                  DETECÇÃO GPS AUTOMÁTICA
                </span>
                <p className="text-xs font-black truncate">
                  {isPickupPhase
                    ? '🎯 Você chegou no local de embarque! (~' + distanceMeters + 'm)'
                    : '🏁 Você chegou ao destino final! (~' + distanceMeters + 'm)'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. RODAPÉ: AÇÕES DIRETAS DE 1 TOQUE (FIM DOS MULTIPLOS BOTÕES MANUAIS) */}
      <div
        className={`p-3 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          highContrastMode
            ? 'bg-black border-amber-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-slate-300 w-full sm:w-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs">
            {isPickupPhase ? (
              <>
                Passageiro esperando em: <strong className="text-white">{targetAddress}</strong>
              </>
            ) : (
              <>
                Destino final da corrida: <strong className="text-white">{targetAddress}</strong>
              </>
            )}
          </span>
        </div>

        {/* BOTÃO PRINCIPAL OU BADGE DE RASTREIO */}
        {readOnly ? (
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Rastreando em Tempo Real • Alagoinha</span>
            </span>
          </div>
        ) : (
          <div className="w-full sm:w-auto flex items-center gap-2">
            {isPickupPhase ? (
              <button
                type="button"
                id="btn-pilot-boarded"
                onClick={onIniciarViagem}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 cursor-pointer transform active:scale-95 transition-all"
              >
                <Bike className="w-5 h-5" />
                <span>Passageiro Embarcou • Iniciar Viagem ao Destino</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-pilot-finish-pin"
                onClick={onAbrirPinModal}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 cursor-pointer transform active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Concluir Desembarque (Digitar PIN)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
