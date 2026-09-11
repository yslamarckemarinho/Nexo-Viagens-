import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  TrendingUp,
  BarChart3,
  Compass,
  Calendar,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  Bike,
  ArrowUpRight,
  ShieldCheck,
  Download
} from 'lucide-react';

export const AdminDemandHeatmapTab: React.FC = () => {
  const { deliveries, pracas, settings } = useApp();
  const [periodoFiltro, setPeriodoFiltro] = useState<'30d' | '7d' | 'hoje' | 'tudo'>('30d');
  const [copied, setCopied] = useState(false);

  // Filter deliveries by selected timeframe
  const filteredDeliveries = useMemo(() => {
    const now = new Date();
    return deliveries.filter((d) => {
      const dDate = new Date(d.createdAt);
      if (periodoFiltro === 'hoje') {
        return dDate.toDateString() === now.toDateString();
      }
      if (periodoFiltro === '7d') {
        const diffDays = (now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      if (periodoFiltro === '30d') {
        const diffDays = (now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [deliveries, periodoFiltro]);

  // Aggregate stats
  const totalViagens = filteredDeliveries.length;
  const faturamentoTotal = filteredDeliveries.reduce((acc, d) => acc + d.deliveryFee, 0);
  const viagensRurais = filteredDeliveries.filter((d) => d.isRural || d.zoneType === 'rural_padrao' || d.zoneType === 'rural_distante').length;
  const viagensUrbanas = totalViagens - viagensRurais;
  const percentRural = totalViagens > 0 ? Math.round((viagensRurais / totalViagens) * 100) : 0;
  const percentUrbana = 100 - percentRural;

  // Breakdown by location/neighborhood (combines pickup and delivery keywords)
  const locationStats = useMemo(() => {
    const counts: Record<string, { count: number; totalFee: number; isRural: boolean }> = {
      'Centro / Matriz': { count: 0, totalFee: 0, isRural: false },
      'Nova Alagoinha': { count: 0, totalFee: 0, isRural: false },
      'Bairro São José': { count: 0, totalFee: 0, isRural: false },
      'Pátio de Festas / Periferia': { count: 0, totalFee: 0, isRural: false },
      'Saída Cuitegi / Rodovia': { count: 0, totalFee: 0, isRural: false },
      'Sítio Maguary (Rural)': { count: 0, totalFee: 0, isRural: true },
      'Sítio Barra (Rural)': { count: 0, totalFee: 0, isRural: true },
      'Sítio Contendas (Rural)': { count: 0, totalFee: 0, isRural: true },
      'Sítio Boa Vista (Rural)': { count: 0, totalFee: 0, isRural: true },
      'Outras Localidades': { count: 0, totalFee: 0, isRural: false },
    };

    filteredDeliveries.forEach((d) => {
      const text = `${d.pickupAddress} ${d.deliveryAddress} ${d.deliveryNeighborhood || ''}`.toLowerCase();
      let matched = false;

      if (text.includes('maguary')) {
        counts['Sítio Maguary (Rural)'].count += 1;
        counts['Sítio Maguary (Rural)'].totalFee += d.deliveryFee;
        matched = true;
      } else if (text.includes('barra')) {
        counts['Sítio Barra (Rural)'].count += 1;
        counts['Sítio Barra (Rural)'].totalFee += d.deliveryFee;
        matched = true;
      } else if (text.includes('contendas')) {
        counts['Sítio Contendas (Rural)'].count += 1;
        counts['Sítio Contendas (Rural)'].totalFee += d.deliveryFee;
        matched = true;
      } else if (text.includes('boa vista')) {
        counts['Sítio Boa Vista (Rural)'].count += 1;
        counts['Sítio Boa Vista (Rural)'].totalFee += d.deliveryFee;
        matched = true;
      } else if (text.includes('nova alagoinha') || text.includes('nova')) {
        counts['Nova Alagoinha'].count += 1;
        counts['Nova Alagoinha'].totalFee += d.deliveryFee;
        matched = true;
      } else if (text.includes('são josé') || text.includes('sao jose')) {
        counts['Bairro São José'].count += 1;
        counts['Bairro São José'].totalFee += d.deliveryFee;
        matched = true;
      } else if (text.includes('pátio') || text.includes('festa')) {
        counts['Pátio de Festas / Periferia'].count += 1;
        counts['Pátio de Festas / Periferia'].totalFee += d.deliveryFee;
        matched = true;
      } else if (text.includes('cuitegi')) {
        counts['Saída Cuitegi / Rodovia'].count += 1;
        counts['Saída Cuitegi / Rodovia'].totalFee += d.deliveryFee;
        matched = true;
      } else if (text.includes('centro') || text.includes('matriz') || text.includes('praça') || text.includes('comércio')) {
        counts['Centro / Matriz'].count += 1;
        counts['Centro / Matriz'].totalFee += d.deliveryFee;
        matched = true;
      } else if (d.isRural) {
        counts['Sítio Maguary (Rural)'].count += 1;
        counts['Sítio Maguary (Rural)'].totalFee += d.deliveryFee;
        matched = true;
      }

      if (!matched) {
        // distribute default
        counts['Centro / Matriz'].count += 1;
        counts['Centro / Matriz'].totalFee += d.deliveryFee;
      }
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalFee: data.totalFee,
        isRural: data.isRural,
        percent: totalViagens > 0 ? Math.round((data.count / totalViagens) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredDeliveries, totalViagens]);

  const topLocation = locationStats[0]?.name || 'Centro / Matriz';

  const handleCopyReport = () => {
    const text = `📊 *RELATÓRIO DE DEMANDA POR BAIRROS & ZONA RURAL*
🏢 Central Nexo Viagens • Alagoinha-PB
🗓️ Período: ${periodoFiltro === '30d' ? 'Últimos 30 Dias (Mês)' : periodoFiltro === '7d' ? 'Últimos 7 Dias' : periodoFiltro === 'hoje' ? 'Hoje' : 'Histórico Total'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏍️ *Total de Corridas:* ${totalViagens}
💰 *Faturamento Total da Demanda:* R$ ${faturamentoTotal.toFixed(2)}
🏙️ *Demanda Urbana:* ${viagensUrbanas} (${percentUrbana}%)
🌾 *Demanda Zona Rural:* ${viagensRurais} (${percentRural}%)
🔥 *Ponto Mais Movimentado:* ${topLocation}
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *RANKING DE LOCALIDADES:*
${locationStats
  .filter((l) => l.count > 0)
  .map((l, i) => `${i + 1}. ${l.name}: ${l.count} viagens (${l.percent}%) • R$ ${l.totalFee.toFixed(2)}`)
  .join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *RECOMENDAÇÃO CENTRAL:* Concentrar mototaxistas no Centro nos horários de pico (11h-13h e 17h-19h) para atender saídas rurais.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with period filters and export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            Demanda por Bairros & Zonas Rurais
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mapeamento de calor e telemetria de viagens para posicionar mototaxistas nas praças de Alagoinha.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {(['hoje', '7d', '30d', 'tudo'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodoFiltro(p)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  periodoFiltro === p
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'hoje' && 'Hoje'}
                {p === '7d' && '7 Dias'}
                {p === '30d' && '30 Dias (Mês)'}
                {p === 'tudo' && 'Tudo'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{copied ? 'Relatório Copiado!' : 'Copiar Resumo'}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total de Viagens</span>
            <Bike className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalViagens}</p>
          <span className="text-[11px] text-slate-500 block">No período selecionado</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Demanda Urbana</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-blue-400">{viagensUrbanas}</p>
            <span className="text-xs font-bold text-slate-400">({percentUrbana}%)</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Centro, bairros e adjacências</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Demanda Rural</span>
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-400">{viagensRurais}</p>
            <span className="text-xs font-bold text-slate-400">({percentRural}%)</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Sítios, chácaras e comunidades</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Faturamento Demanda</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">R$ {faturamentoTotal.toFixed(2)}</p>
          <span className="text-[11px] text-slate-500 block">Movimentação total em tarifas</span>
        </div>
      </div>

      {/* Urban vs Rural Distribution Bar */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">Proporção Urbana vs. Rural de Alagoinha</span>
          <span className="text-slate-400">
            {percentUrbana}% Urbano • {percentRural}% Rural
          </span>
        </div>

        <div className="w-full h-4 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
          <div
            style={{ width: `${percentUrbana}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            title={`Urbana: ${percentUrbana}%`}
          />
          <div
            style={{ width: `${percentRural}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            title={`Rural: ${percentRural}%`}
          />
        </div>
      </div>

      {/* Heatmap / Location Demand Table */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-sm">Distribuição de Demanda por Bairro e Sítio</h3>
            <p className="text-xs text-slate-400">
              Ranking de destinos e origens com maior solicitação de mototáxi
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Principal Pico: <strong className="text-cyan-400">{topLocation}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {locationStats.map((item, index) => (
            <div
              key={item.name}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] ${
                      index === 0
                        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                        : index === 1
                        ? 'bg-slate-700 text-slate-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <strong className="text-white text-sm">{item.name}</strong>
                    <span className="text-[10px] text-slate-400 block">
                      {item.isRural ? 'Zona Rural de Alagoinha' : 'Perímetro Urbano'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-white">{item.count} viagens</span>
                  <span className="text-[11px] text-emerald-400 font-bold block">
                    R$ {item.totalFee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  style={{ width: `${Math.max(5, item.percent)}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.isRural ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Positioning Insights for Central Dispatch */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Inteligência de Posicionamento para a Central</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white block flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-emerald-400" />
              Ponto Central / Praça da Matriz
            </strong>
            <p className="text-slate-400 text-[11px]">
              Concentra mais de 40% dos embarques diários. Mantenha no mínimo 3 a 5 pilotos na fila entre 11h e 13h (horário de almoço e saída rural).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <strong className="text-white block flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              Rotas Rurais (Sítio Maguary & Barra)
            </strong>
            <p className="text-slate-400 text-[11px]">
              Viagens rurais geram ticket médio mais alto (R$ 15 a R$ 25). Incentive pilotos disponíveis no Ponto 2 e Ponto 3 a atenderem chamados rurais na volta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
