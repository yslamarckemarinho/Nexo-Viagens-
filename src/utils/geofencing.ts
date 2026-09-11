// Utilitário de Geofencing para detecção automática de Praças em Alagoinha-PB
import { Praca } from '../types';

/**
 * Coordenadas de referência dos principais pontos e bairros de Alagoinha-PB
 */
export const PONTOS_REFERENCIA_ALAGOINHA = [
  { id: 'centro', nome: 'Praça Central (Barão do Rio Branco)', bairro: 'Centro', lat: -6.9535, lon: -35.5463 },
  { id: 'mercado', nome: 'Mercado Público Municipal', bairro: 'Centro', lat: -6.9542, lon: -35.5451 },
  { id: 'patio', nome: 'Pátio de Eventos (Saída Cuitegi)', bairro: 'Pátio de Eventos', lat: -6.9515, lon: -35.5420 },
  { id: 'hospital', nome: 'Unidade Mista de Saúde / Hospital', bairro: 'Centro / Saúde', lat: -6.9550, lon: -35.5480 },
  { id: 'sao-jose', nome: 'Bairro São José', bairro: 'São José', lat: -6.9560, lon: -35.5490 },
  { id: 'rua-nova', nome: 'Rua Nova', bairro: 'Rua Nova', lat: -6.9525, lon: -35.5480 },
  { id: 'prefeitura', nome: 'Prefeitura Municipal de Alagoinha', bairro: 'Centro', lat: -6.9530, lon: -35.5460 },
  { id: 'santa-tereza', nome: 'Loteamento Santa Tereza', bairro: 'Santa Tereza', lat: -6.9480, lon: -35.5410 },
  { id: 'boa-vista', nome: 'Bairro Boa Vista', bairro: 'Boa Vista', lat: -6.9510, lon: -35.5495 },
  { id: 'conjunto-novo', nome: 'Conjunto Habitacional Novo', bairro: 'Conjunto Novo', lat: -6.9490, lon: -35.5450 },
  { id: 'sitio-maguary', nome: 'Sítio Maguary (Zona Rural)', bairro: 'Zona Rural', lat: -6.9650, lon: -35.5600 },
  { id: 'sitio-alagoinha-velha', nome: 'Sítio Alagoinha Velha (Zona Rural)', bairro: 'Zona Rural', lat: -6.9700, lon: -35.5350 },
];

/**
 * Calcula a distância em metros entre duas coordenadas geográficas (fórmula de Haversine)
 */
export function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

/**
 * Estima o tempo de chegada em minutos com base na distância em metros e velocidade média urbana de moto (24 km/h ~ 400m/min)
 */
export function estimarTempoChegadaMinutos(
  distanciaMetros: number,
  velocidadeMediaKmH: number = 24
): number {
  if (distanciaMetros <= 50) return 1; // Menos de 50 metros = chegando
  const metrosPorMinuto = (velocidadeMediaKmH * 1000) / 60;
  const minutos = Math.ceil(distanciaMetros / metrosPorMinuto);
  return Math.max(1, minutos);
}

/**
 * Identifica o ponto ou bairro mais próximo em Alagoinha-PB a partir das coordenadas do GPS
 */
export function identificarPontoAlagoinhaPorCoords(
  latitude: number,
  longitude: number
): {
  pontoMaisProximo: (typeof PONTOS_REFERENCIA_ALAGOINHA)[0];
  distanciaMetros: number;
  descricaoSugerida: string;
} {
  let pontoMaisProximo = PONTOS_REFERENCIA_ALAGOINHA[0];
  let menorDistancia = Infinity;

  for (const ponto of PONTOS_REFERENCIA_ALAGOINHA) {
    const d = calcularDistanciaMetros(latitude, longitude, ponto.lat, ponto.lon);
    if (d < menorDistancia) {
      menorDistancia = d;
      pontoMaisProximo = ponto;
    }
  }

  const metros = Math.round(menorDistancia);
  let descricaoSugerida = '';
  if (metros <= 80) {
    descricaoSugerida = `${pontoMaisProximo.nome} (Sua posição exata)`;
  } else if (metros <= 350) {
    descricaoSugerida = `Próximo a(o) ${pontoMaisProximo.nome} (~${metros}m)`;
  } else {
    descricaoSugerida = `Região do ${pontoMaisProximo.bairro} (~${metros}m de ${pontoMaisProximo.nome})`;
  }

  return {
    pontoMaisProximo,
    distanciaMetros: metros,
    descricaoSugerida,
  };
}

/**
 * Gera URL direta para navegação no Google Maps ou Waze
 */
export function gerarUrlGoogleMapsRota(
  origemLat?: number,
  origemLng?: number,
  destinoLat?: number,
  destinoLng?: number,
  destinoTexto?: string
): string {
  if (origemLat && origemLng && destinoLat && destinoLng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origemLat},${origemLng}&destination=${destinoLat},${destinoLng}&travelmode=driving`;
  }
  if (destinoLat && destinoLng) {
    return `https://www.google.com/maps/search/?api=1&query=${destinoLat},${destinoLng}`;
  }
  const query = encodeURIComponent(`${destinoTexto || ''}, Alagoinha - PB`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export interface GeofenceResult {
  dentroDePraca: boolean;
  pracaDetectada: Praca | null;
  distanciaMetros: number | null;
  mensagem: string;
}

/**
 * Identifica a Praça mais próxima com base na localização atual do mototaxista
 * Raio padrão de tolerância: 400 metros do ponto central da praça
 */
export function detectarPracaMaisProxima(
  latitude: number,
  longitude: number,
  pracas: Praca[],
  raioToleranciaMetros: number = 400
): GeofenceResult {
  const pracasAtivasComCoords = pracas.filter(
    (p) => p.ativa && typeof p.latitude === 'number' && typeof p.longitude === 'number'
  );

  if (pracasAtivasComCoords.length === 0) {
    return {
      dentroDePraca: false,
      pracaDetectada: null,
      distanciaMetros: null,
      mensagem: 'Nenhuma praça com coordenadas configuradas.',
    };
  }

  let pracaMaisProxima: Praca | null = null;
  let menorDistancia = Infinity;

  for (const praca of pracasAtivasComCoords) {
    const dist = calcularDistanciaMetros(
      latitude,
      longitude,
      praca.latitude!,
      praca.longitude!
    );

    if (dist < menorDistancia) {
      menorDistancia = dist;
      pracaMaisProxima = praca;
    }
  }

  if (pracaMaisProxima && menorDistancia <= raioToleranciaMetros) {
    return {
      dentroDePraca: true,
      pracaDetectada: pracaMaisProxima,
      distanciaMetros: Math.round(menorDistancia),
      mensagem: `Você está na ${pracaMaisProxima.nome} (~${Math.round(menorDistancia)}m).`,
    };
  }

  return {
    dentroDePraca: false,
    pracaDetectada: pracaMaisProxima,
    distanciaMetros: pracaMaisProxima ? Math.round(menorDistancia) : null,
    mensagem: pracaMaisProxima
      ? `A praça mais próxima é ${pracaMaisProxima.nome} a ${Math.round(menorDistancia)}m (fora do raio de tolerância de ${raioToleranciaMetros}m).`
      : 'Fora do raio das praças urbanas.',
  };
}
