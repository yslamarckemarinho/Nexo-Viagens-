// ============================================================================
// CALCULADORA OFICIAL DE TARIFAS - NEXO VIAGENS ALAGOINHA-PB
// O Sistema decide 100% o valor com base na rota, distância, zona e bandeira.
// O passageiro não altera nem escolhe o preço.
// ============================================================================

import { PONTOS_REFERENCIA_ALAGOINHA, calcularDistanciaMetros } from './geofencing';

export interface CalculoTarifaParams {
  origemTexto: string;
  destinoTexto: string;
  origemCoords?: { lat: number; lng: number } | null;
  destinoCoords?: { lat: number; lng: number } | null;
  tarifaDinamicaAtiva?: boolean;
  tarifaDinamicaAdicional?: number;
  tarifaBaseConfig?: number;
}

export interface ResultadoTarifa {
  valorFinal: number;
  valorBase: number;
  adicionalDinamica: number;
  categoriaZona: 'urbana_centro' | 'urbana_bairro' | 'rural';
  nomeZona: string;
  distanciaEstimadaMetros: number;
  motivoExplicativo: string;
}

/**
 * Tabela de tarifas oficiais de Alagoinha:
 * - Urbana Central (até 1.2km): R$ 4,00 (Tarifa Padrão da Matriz/Centro)
 * - Urbana Bairro / Perímetro (1.2km a 2.8km): R$ 5,00 (São José, Loteamento Santa Tereza, Pátio, Nova)
 * - Rural / Sítio (acima de 2.8km ou palavra sítio/rural): R$ 12,00 a R$ 18,00
 */
export function calcularTarifaOficial(params: CalculoTarifaParams): ResultadoTarifa {
  const {
    origemTexto,
    destinoTexto,
    origemCoords,
    destinoCoords,
    tarifaDinamicaAtiva = false,
    tarifaDinamicaAdicional = 2.0,
    tarifaBaseConfig = 4.0,
  } = params;

  const destLower = (destinoTexto || '').toLowerCase();
  const origLower = (origemTexto || '').toLowerCase();

  // 1. Detecção de Zona Rural por palavras-chave
  const isRuralKeyword =
    destLower.includes('sítio') ||
    destLower.includes('sitio') ||
    destLower.includes('rural') ||
    destLower.includes('granja') ||
    destLower.includes('maguary') ||
    destLower.includes('alagoinha velha') ||
    destLower.includes('assentamento') ||
    destLower.includes('fazenda') ||
    destLower.includes('chácara') ||
    destLower.includes('chacara') ||
    origLower.includes('sítio') ||
    origLower.includes('sitio') ||
    origLower.includes('rural');

  // 2. Tenta obter coordenadas reais dos pontos de referência se não informadas
  let latOrig = origemCoords?.lat;
  let lonOrig = origemCoords?.lng;
  let latDest = destinoCoords?.lat;
  let lonDest = destinoCoords?.lng;

  if (!latOrig || !lonOrig) {
    const matchOrig = PONTOS_REFERENCIA_ALAGOINHA.find(
      (p) => origLower.includes(p.nome.toLowerCase()) || origLower.includes(p.id) || origLower.includes(p.bairro.toLowerCase())
    );
    if (matchOrig) {
      latOrig = matchOrig.lat;
      lonOrig = matchOrig.lon;
    } else {
      // Centro padrão
      latOrig = -6.9535;
      lonOrig = -35.5463;
    }
  }

  if (!latDest || !lonDest) {
    const matchDest = PONTOS_REFERENCIA_ALAGOINHA.find(
      (p) => destLower.includes(p.nome.toLowerCase()) || destLower.includes(p.id) || destLower.includes(p.bairro.toLowerCase())
    );
    if (matchDest) {
      latDest = matchDest.lat;
      lonDest = matchDest.lon;
    }
  }

  // 3. Cálculo de Distância em Linha / Trajeto Estimado
  let distanciaMetros = 1000; // 1km padrão urbano
  if (latOrig && lonOrig && latDest && lonDest) {
    // Fator 1.35x para converter distância em linha reta para traçado real de ruas
    distanciaMetros = Math.round(calcularDistanciaMetros(latOrig, lonOrig, latDest, lonDest) * 1.35);
  }

  // 4. Determinação da Categoria e Valor Base pelo Sistema
  let valorBase = tarifaBaseConfig || 4.0;
  let categoriaZona: 'urbana_centro' | 'urbana_bairro' | 'rural' = 'urbana_centro';
  let nomeZona = 'Urbana Central';
  let motivoExplicativo = 'Deslocamento dentro do perímetro central urbano';

  if (isRuralKeyword || distanciaMetros > 3200) {
    categoriaZona = 'rural';
    nomeZona = 'Zona Rural / Sítio';
    // Se for muito longe (ex: acima de 5km), cobra proporcional
    if (distanciaMetros > 5000) {
      valorBase = 15.0;
      motivoExplicativo = `Deslocamento rural estendido (~${(distanciaMetros / 1000).toFixed(1)} km)`;
    } else {
      valorBase = 12.0;
      motivoExplicativo = `Deslocamento para estrada de terra / zona rural (~${(distanciaMetros / 1000).toFixed(1)} km)`;
    }
  } else if (
    distanciaMetros > 1300 ||
    destLower.includes('santa tereza') ||
    destLower.includes('pátio') ||
    destLower.includes('patio') ||
    destLower.includes('cuitegi') ||
    destLower.includes('boa vista') ||
    destLower.includes('conjunto') ||
    destLower.includes('são josé') ||
    destLower.includes('sao jose')
  ) {
    categoriaZona = 'urbana_bairro';
    nomeZona = 'Urbana Bairro / Perímetro';
    valorBase = 5.0;
    motivoExplicativo = `Deslocamento entre bairros ou loteamentos periféricos (~${(distanciaMetros / 1000).toFixed(1)} km)`;
  } else {
    categoriaZona = 'urbana_centro';
    nomeZona = 'Urbana Central';
    valorBase = Math.max(4.0, tarifaBaseConfig);
    motivoExplicativo = `Deslocamento rápido no centro e comércio (~${distanciaMetros}m)`;
  }

  // 5. Adicional de Tarifa Dinâmica (se ativo pelo administrador da Central)
  const adicionalDinamica = tarifaDinamicaAtiva ? Number(tarifaDinamicaAdicional) || 2.0 : 0.0;
  const valorFinal = Number((valorBase + adicionalDinamica).toFixed(2));

  return {
    valorFinal,
    valorBase,
    adicionalDinamica,
    categoriaZona,
    nomeZona,
    distanciaEstimadaMetros: distanciaMetros,
    motivoExplicativo,
  };
}
