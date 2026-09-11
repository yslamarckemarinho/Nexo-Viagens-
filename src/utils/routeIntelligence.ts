import { DeliveryZoneType } from '../types';

export interface LocationPreset {
  id: string;
  name: string;
  category: 'central' | 'distante' | 'rural';
  zoneType: DeliveryZoneType;
  description: string;
  defaultFee?: number;
  keywords: string[];
}

export interface ZoneIntelligenceResult {
  zoneType: DeliveryZoneType;
  fee: number;
  label: string;
  shortLabel: string;
  explanation: string;
  isRural: boolean;
  confidence: 'high' | 'medium' | 'default';
  detectedLocationName?: string;
  badge: {
    bg: string;
    text: string;
    border: string;
    pillBg: string;
  };
}

// Catálogo de localidades e referências de Alagoinha-PB
export const ALAGOINHA_LOCATIONS: LocationPreset[] = [
  // 1. ZONA URBANA / CENTRAL (R$ 3,50)
  {
    id: 'centro',
    name: 'Centro',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Área central de Alagoinha (Centro Histórico, Matriz, Mercado Público, Bancos)',
    keywords: ['centro', 'comercio', 'matriz', 'mercado', 'praca', 'barao', 'joao pessoa', 'antenor navarro', 'rua grande'],
  },
  {
    id: 'rua-nova',
    name: 'Rua Nova',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Bairro Rua Nova e adjacências centrais',
    keywords: ['rua nova', 'rua nova central'],
  },
  {
    id: 'sao-jose',
    name: 'Bairro São José',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Bairro São José (Área urbana central)',
    keywords: ['sao jose', 'bairro sao jose', 'rua sao jose'],
  },
  {
    id: 'boa-vista',
    name: 'Bairro Boa Vista',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Bairro Boa Vista urbano',
    keywords: ['boa vista', 'bairro boa vista'],
  },
  {
    id: 'conjunto-novo',
    name: 'Conjunto Novo',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Conjunto Habitacional Novo (Área urbana)',
    keywords: ['conjunto novo', 'cj novo', 'conj habitacional'],
  },
  {
    id: 'morro-cruz',
    name: 'Morro da Cruz',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Morro da Cruz (Trecho urbano)',
    keywords: ['morro da cruz', 'morro', 'alto da cruz'],
  },
  {
    id: 'vila-operaria',
    name: 'Vila Operária',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Vila Operária e imediações',
    keywords: ['vila operaria', 'vila'],
  },
  {
    id: 'bairro-flores',
    name: 'Bairro das Flores',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Bairro das Flores (Perímetro urbano)',
    keywords: ['flores', 'bairro das flores', 'rua das flores'],
  },
  {
    id: 'santo-antonio',
    name: 'Bairro Santo Antônio',
    category: 'central',
    zoneType: 'urbana_central',
    description: 'Bairro Santo Antônio urbano',
    keywords: ['santo antonio', 'bairro santo antonio'],
  },

  // 2. ZONA DISTANTE / PERIFERIA / SAÍDAS (R$ 7,00)
  {
    id: 'loteamento-santa-tereza',
    name: 'Loteamento Santa Tereza',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Loteamento periférico afastado do centro',
    keywords: ['santa tereza', 'lot santa tereza', 'loteamento santa tereza'],
  },
  {
    id: 'loteamento-boa-esperanca',
    name: 'Loteamento Boa Esperança',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Loteamento afastado / Expansão urbana',
    keywords: ['boa esperanca', 'lot boa esperanca', 'loteamento boa esperanca'],
  },
  {
    id: 'loteamento-portal-sol',
    name: 'Loteamento Portal do Sol',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Área residencial afastada da cidade',
    keywords: ['portal do sol', 'portal', 'loteamento portal'],
  },
  {
    id: 'loteamento-vale-verde',
    name: 'Loteamento Vale Verde',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Loteamento e chácaras do limite urbano',
    keywords: ['vale verde', 'loteamento vale verde'],
  },
  {
    id: 'saida-cuitegi',
    name: 'Saída para Cuitegi (PB-075)',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Rodovia PB-075 sentido Cuitegi / Postos / KM rodoviário',
    keywords: ['cuitegi', 'saida cuitegi', 'saida para cuitegi', 'saida p/ cuitegi', 'pb-075 cuitegi'],
  },
  {
    id: 'saida-alagoa-grande',
    name: 'Saída para Alagoa Grande',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Rodovia PB-075 sentido Alagoa Grande / Contorno',
    keywords: ['alagoa grande', 'saida alagoa grande', 'saida para alagoa grande', 'saida p/ alagoa grande'],
  },
  {
    id: 'saida-guarabira',
    name: 'Saída para Guarabira / Trevo',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Contorno rodoviário e saídas perimetrais',
    keywords: ['guarabira', 'saida guarabira', 'trevo', 'contorno', 'posto rodoviario'],
  },
  {
    id: 'conjunto-padre-geraldo',
    name: 'Conjunto Padre Geraldo',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Conjunto periférico distante',
    keywords: ['padre geraldo', 'conjunto padre geraldo'],
  },
  {
    id: 'distrito-industrial',
    name: 'Distrito / Área Industrial',
    category: 'distante',
    zoneType: 'urbana_distante',
    description: 'Zona de galpões e indústrias no limite do município',
    keywords: ['industrial', 'distrito industrial', 'area industrial', 'galpoes'],
  },

  // 3. ZONA RURAL / SÍTIOS / COMUNIDADES (A COMBINAR)
  {
    id: 'sitio-maguary',
    name: 'Sítio Maguary',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Maguary',
    keywords: ['maguary', 'maguari', 'sitio maguary', 'sitio maguari'],
  },
  {
    id: 'sitio-mane-velho',
    name: 'Sítio Mané Velho',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Mané Velho',
    keywords: ['mane velho', 'sitio mane velho', 'sitio manoel velho'],
  },
  {
    id: 'sitio-contendas',
    name: 'Sítio Contendas',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Contendas',
    keywords: ['contendas', 'sitio contendas'],
  },
  {
    id: 'sitio-nova-descoberta',
    name: 'Sítio Nova Descoberta',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Nova Descoberta',
    keywords: ['nova descoberta', 'sitio nova descoberta'],
  },
  {
    id: 'sitio-barra',
    name: 'Sítio Barra',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Barra',
    keywords: ['barra', 'sitio barra', 'sitio da barra'],
  },
  {
    id: 'sitio-gameleira',
    name: 'Sítio Gameleira',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Gameleira',
    keywords: ['gameleira', 'sitio gameleira'],
  },
  {
    id: 'sitio-jacu',
    name: 'Sítio Jacu',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Jacu',
    keywords: ['jacu', 'sitio jacu'],
  },
  {
    id: 'sitio-cuite',
    name: 'Sítio Cuité',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Cuité',
    keywords: ['cuite', 'sitio cuite'],
  },
  {
    id: 'sitio-lagedo',
    name: 'Sítio Lagedo',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Lagedo',
    keywords: ['lagedo', 'lajedo', 'sitio lagedo', 'sitio lajedo'],
  },
  {
    id: 'sitio-cachoeira',
    name: 'Sítio Cachoeira',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Cachoeira',
    keywords: ['cachoeira', 'sitio cachoeira'],
  },
  {
    id: 'sitio-olho-dagua',
    name: 'Sítio Olho D’Água',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Olho D’Água',
    keywords: ['olho dagua', 'olho d agua', 'sitio olho dagua'],
  },
  {
    id: 'sitio-pitombeira',
    name: 'Sítio Pitombeira',
    category: 'rural',
    zoneType: 'rural',
    description: 'Zona Rural de Alagoinha — Sítio Pitombeira',
    keywords: ['pitombeira', 'sitio pitombeira'],
  },
];

// Termos genéricos para identificação semântica de rotas
const RURAL_GENERIC_KEYWORDS = [
  'sitio',
  'sítio',
  'fazenda',
  'engenho',
  'povoado',
  'assentamento',
  'agrovila',
  'comunidade rural',
  'chacara rural',
  'chácara rural',
  'distrito rural',
  'gleba',
  'haras',
  'granja',
  'zona rural',
  'rural',
  'zona interior',
  'estrada de terra',
];

const DISTANTE_GENERIC_KEYWORDS = [
  'loteamento',
  'lot.',
  'lot ',
  'saida',
  'saída',
  'saida para',
  'saida p/',
  'cuitegi',
  'alagoa grande',
  'guarabira',
  'rodovia',
  'pb-075',
  'pb 075',
  'pb075',
  'trevo',
  'periferia',
  'limite urbano',
  'contorno',
  'afastado',
  'portal do sol',
  'santa tereza',
  'boa esperanca',
  'boa esperança',
  'vale verde',
  'distrito industrial',
  'expansao',
  'expansão',
  'padre geraldo',
  'km 1',
  'km 2',
  'km 3',
  'km 4',
  'km 5',
];

const CENTRAL_GENERIC_KEYWORDS = [
  'centro',
  'rua nova',
  'sao jose',
  'são josé',
  'boa vista',
  'conjunto novo',
  'morro da cruz',
  'matriz',
  'praca',
  'praça',
  'comercio',
  'comércio',
  'mercado',
  'joao pessoa',
  'joão pessoa',
  'antenor navarro',
  'vila operaria',
  'vila operária',
  'flores',
  'santo antonio',
  'santo antônio',
  'rua grande',
  'rua da linha',
];

/**
 * Remove acentos e caracteres especiais para comparação flexível
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Motor de detecção inteligente de rotas para Alagoinha-PB
 */
export function detectDeliveryZone(
  addressInput: string,
  feeCentral = 3.50,
  feeDistante = 7.00
): ZoneIntelligenceResult {
  const normalized = normalizeText(addressInput);

  if (!normalized) {
    return {
      zoneType: 'urbana_central',
      fee: feeCentral,
      label: `Zona Central / Urbana (R$ ${feeCentral.toFixed(2)})`,
      shortLabel: 'Centro / Urbana',
      explanation: 'Endereço padrão dentro do perímetro urbano central de Alagoinha.',
      isRural: false,
      confidence: 'default',
      badge: {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        pillBg: 'bg-emerald-500/20',
      },
    };
  }

  // 1. Verificar se coincide com catálogo de Sítios ou Palavras Rurais (Prioridade Máxima)
  for (const loc of ALAGOINHA_LOCATIONS.filter((l) => l.category === 'rural')) {
    for (const kw of loc.keywords) {
      if (normalized.includes(normalizeText(kw))) {
        return {
          zoneType: 'rural',
          fee: 0,
          label: 'Zona Rural / Sítio (A Combinar)',
          shortLabel: 'Zona Rural (A Combinar)',
          explanation: `Detectado "${loc.name}" — Por se tratar de Zona Rural em Alagoinha, a taxa deve ser combinada com o motorista.`,
          isRural: true,
          confidence: 'high',
          detectedLocationName: loc.name,
          badge: {
            bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
            text: 'text-amber-300',
            border: 'border-amber-500/30',
            pillBg: 'bg-amber-500/20',
          },
        };
      }
    }
  }

  for (const kw of RURAL_GENERIC_KEYWORDS) {
    if (normalized.includes(normalizeText(kw))) {
      return {
        zoneType: 'rural',
        fee: 0,
        label: 'Zona Rural / Sítio (A Combinar)',
        shortLabel: 'Zona Rural (A Combinar)',
        explanation: `Detectado termo rural ("${kw}") — Por ser fora do perímetro urbano, o valor deve ser combinado com o motorista parceiro.`,
        isRural: true,
        confidence: 'high',
        badge: {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          text: 'text-amber-300',
          border: 'border-amber-500/30',
          pillBg: 'bg-amber-500/20',
        },
      };
    }
  }

  // 2. Verificar se coincide com catálogo de Bairros Distantes / Periferia / Saídas (R$ 7,00)
  for (const loc of ALAGOINHA_LOCATIONS.filter((l) => l.category === 'distante')) {
    for (const kw of loc.keywords) {
      if (normalized.includes(normalizeText(kw))) {
        return {
          zoneType: 'urbana_distante',
          fee: feeDistante,
          label: `Zona Distante / Periferia (R$ ${feeDistante.toFixed(2)})`,
          shortLabel: `Distante (R$ ${feeDistante.toFixed(2)})`,
          explanation: `Detectado "${loc.name}" — Localidade periférica/saída rodoviária de Alagoinha com taxa de rota estendida.`,
          isRural: false,
          confidence: 'high',
          detectedLocationName: loc.name,
          badge: {
            bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
            text: 'text-cyan-300',
            border: 'border-cyan-500/30',
            pillBg: 'bg-cyan-500/20',
          },
        };
      }
    }
  }

  for (const kw of DISTANTE_GENERIC_KEYWORDS) {
    if (normalized.includes(normalizeText(kw))) {
      return {
        zoneType: 'urbana_distante',
        fee: feeDistante,
        label: `Zona Distante / Periferia (R$ ${feeDistante.toFixed(2)})`,
        shortLabel: `Distante (R$ ${feeDistante.toFixed(2)})`,
        explanation: `Detectada localidade periférica/rodoviária ("${kw}") — Rota mais distante do centro de Alagoinha.`,
        isRural: false,
        confidence: 'high',
        badge: {
          bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          text: 'text-cyan-300',
          border: 'border-cyan-500/30',
          pillBg: 'bg-cyan-500/20',
        },
      };
    }
  }

  // 3. Verificar se coincide com catálogo de Bairros Centrais / Urbanos (R$ 3,50)
  for (const loc of ALAGOINHA_LOCATIONS.filter((l) => l.category === 'central')) {
    for (const kw of loc.keywords) {
      if (normalized.includes(normalizeText(kw))) {
        return {
          zoneType: 'urbana_central',
          fee: feeCentral,
          label: `Zona Central / Urbana (R$ ${feeCentral.toFixed(2)})`,
          shortLabel: `Centro (R$ ${feeCentral.toFixed(2)})`,
          explanation: `Detectado "${loc.name}" — Perímetro urbano central de Alagoinha.`,
          isRural: false,
          confidence: 'high',
          detectedLocationName: loc.name,
          badge: {
            bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            text: 'text-emerald-400',
            border: 'border-emerald-500/30',
            pillBg: 'bg-emerald-500/20',
          },
        };
      }
    }
  }

  for (const kw of CENTRAL_GENERIC_KEYWORDS) {
    if (normalized.includes(normalizeText(kw))) {
      return {
        zoneType: 'urbana_central',
        fee: feeCentral,
        label: `Zona Central / Urbana (R$ ${feeCentral.toFixed(2)})`,
        shortLabel: `Centro (R$ ${feeCentral.toFixed(2)})`,
        explanation: `Detectado perímetro urbano de Alagoinha ("${kw}").`,
        isRural: false,
        confidence: 'medium',
        badge: {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          pillBg: 'bg-emerald-500/20',
        },
      };
    }
  }

  // Fallback padrão se não contiver palavras-chave periféricas ou rurais -> Urbana Central (R$ 3,50)
  return {
    zoneType: 'urbana_central',
    fee: feeCentral,
    label: `Zona Central / Urbana (R$ ${feeCentral.toFixed(2)})`,
    shortLabel: `Centro (R$ ${feeCentral.toFixed(2)})`,
    explanation: 'Rota padrão no perímetro urbano de Alagoinha-PB.',
    isRural: false,
    confidence: 'default',
    badge: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      pillBg: 'bg-emerald-500/20',
    },
  };
}

/**
 * Filtra localidades para auto-completar enquanto o operador digita
 */
export function searchAlagoinhaLocations(query: string): LocationPreset[] {
  if (!query || query.trim().length < 2) {
    return ALAGOINHA_LOCATIONS.slice(0, 6); // Principais sugestões iniciais
  }

  const normQuery = normalizeText(query);
  return ALAGOINHA_LOCATIONS.filter((loc) => {
    const normName = normalizeText(loc.name);
    const normDesc = normalizeText(loc.description);
    const matchesKeyword = loc.keywords.some((kw) => normalizeText(kw).includes(normQuery));
    return normName.includes(normQuery) || normDesc.includes(normQuery) || matchesKeyword;
  });
}

/**
 * Retorna badges visuais para exibição nos cards e tabelas
 */
export function getZoneBadgeDetails(
  zoneType?: DeliveryZoneType,
  fee = 3.50,
  isRural = false
) {
  if (zoneType === 'rural' || isRural) {
    return {
      label: '🌾 Zona Rural (A Combinar)',
      short: 'Zona Rural (A Combinar)',
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      pillBg: 'bg-amber-500/20',
      icon: '🌾',
    };
  }

  if (zoneType === 'urbana_distante') {
    return {
      label: `🛵 Distante / Periferia (R$ ${fee.toFixed(2)})`,
      short: `Distante (R$ ${fee.toFixed(2)})`,
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-300',
      border: 'border-cyan-500/30',
      pillBg: 'bg-cyan-500/20',
      icon: '🛵',
    };
  }

  return {
    label: `🏙️ Centro / Urbana (R$ ${fee.toFixed(2)})`,
    short: `Centro (R$ ${fee.toFixed(2)})`,
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    pillBg: 'bg-emerald-500/20',
    icon: '🏙️',
  };
}
