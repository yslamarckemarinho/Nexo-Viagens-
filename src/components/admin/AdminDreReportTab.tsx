import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Printer,
  Download,
  CheckCircle2,
  PieChart,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminDreReportTab: React.FC = () => {
  const { deliveries, settings, couriers } = useApp();
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'tudo'>('mes');

  // Filtrar corridas concluídas
  const completedDeliveries = deliveries.filter((d) => d.status === 'corrida_concluida');

  // Filtragem por período
  const now = new Date();
  const filteredDeliveries = completedDeliveries.filter((d) => {
    if (periodo === 'tudo') return true;
    const date = new Date(d.createdAt);
    if (periodo === 'hoje') {
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }
    if (periodo === 'semana') {
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (periodo === 'mes') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Métricas do DRE
  const totalViagens = filteredDeliveries.length;
  const faturamentoBruto = filteredDeliveries.reduce(
    (acc, d) => acc + (d.valor_corrida || d.deliveryFee || 0),
    0
  );
  const totalTaxasCentral = filteredDeliveries.reduce(
    (acc, d) => acc + (d.valor_destinado_central || d.centralFee || 0),
    0
  );
  const repassesLiquidosMototaxistas = filteredDeliveries.reduce(
    (acc, d) => acc + (d.valor_liquido_mototaxista || d.courierEarnings || 0),
    0
  );
  const ticketMedio = totalViagens > 0 ? faturamentoBruto / totalViagens : 0;
  const margemCentralPercentual =
    faturamentoBruto > 0 ? (totalTaxasCentral / faturamentoBruto) * 100 : 0;

  // Exportar para CSV
  const handleExportCSV = () => {
    const headers = [
      'Código',
      'Data/Hora',
      'Passageiro',
      'Mototaxista',
      'Praça Origem',
      'Valor Total (R$)',
      'Taxa Central (R$)',
      'Líquido Mototaxista (R$)',
    ];

    const rows = filteredDeliveries.map((d) => [
      d.code || `#${d.codigo}`,
      new Date(d.createdAt).toLocaleString('pt-BR'),
      `"${d.passageiro_nome || d.merchantName}"`,
      `"${d.mototaxista_nome || d.courierName || 'N/A'}"`,
      `"${d.praca_origem_nome || d.pracaZoneName || 'Urbana'}"`,
      (d.valor_corrida || d.deliveryFee || 0).toFixed(2),
      (d.valor_destinado_central || d.centralFee || 0).toFixed(2),
      (d.valor_liquido_mototaxista || d.courierEarnings || 0).toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `dre_nexo_viagens_${periodo}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">DRE & Fechamento Financeiro</h2>
              <p className="text-xs text-slate-400">
                Demonstrativo de Resultados do Exercício da Central • Alagoinha-PB
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setPeriodo('hoje')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periodo === 'hoje' ? 'bg-cyan-600 text-white shadow' : 'hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodo('semana')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periodo === 'semana' ? 'bg-cyan-600 text-white shadow' : 'hover:text-white'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periodo === 'mes' ? 'bg-cyan-600 text-white shadow' : 'hover:text-white'
              }`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => setPeriodo('tudo')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                periodo === 'tudo' ? 'bg-cyan-600 text-white shadow' : 'hover:text-white'
              }`}
            >
              Todos
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>CSV / Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir DRE</span>
          </button>
        </div>
      </div>

      {/* DRE Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            Receita Bruta Total
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </span>
          <p className="text-2xl font-black text-white">
            R$ {faturamentoBruto.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400">
            {totalViagens} viagens concluídas
          </span>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg space-y-2 bg-emerald-950/10">
          <span className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
            Faturamento Líquido Central
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </span>
          <p className="text-2xl font-black text-emerald-400">
            R$ {totalTaxasCentral.toFixed(2)}
          </p>
          <span className="text-[11px] text-emerald-400/80 font-medium">
            Margem retida: {margemCentralPercentual.toFixed(1)}%
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            Repasses aos Mototaxistas
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </span>
          <p className="text-2xl font-black text-amber-300">
            R$ {repassesLiquidosMototaxistas.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400">
            Ganhos diretos dos profissionais
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            Ticket Médio por Corrida
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </span>
          <p className="text-2xl font-black text-purple-300">
            R$ {ticketMedio.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400">
            Média no perímetro urbano
          </span>
        </div>
      </div>

      {/* Demonstrativo Estruturado */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800">
          Demonstrativo Sintético de Resultados
        </h3>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-300 font-sans font-medium">
              (+) Faturamento Bruto de Corridas (Passageiros)
            </span>
            <span className="text-white font-bold">R$ {faturamentoBruto.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-800/80 text-amber-400">
            <span className="text-slate-300 font-sans font-medium">
              (-) Repasses Líquidos Destinados aos Mototaxistas
            </span>
            <span className="font-bold">- R$ {repassesLiquidosMototaxistas.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-3 border-b-2 border-emerald-500/40 text-emerald-400 text-sm bg-emerald-500/5 px-3 rounded-xl font-bold">
            <span className="font-sans">(=) RESULTADO OPERACIONAL BRUTO DA CENTRAL</span>
            <span>R$ {totalTaxasCentral.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Lista de Corridas Filtradas */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-white text-base">
            Detalhamento de Viagens no Período ({filteredDeliveries.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Foco exclusivo no perímetro urbano de Alagoinha-PB
          </span>
        </div>

        {filteredDeliveries.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Nenhuma corrida concluída encontrada no período selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Passageiro</th>
                  <th className="py-2.5 px-3">Mototaxista</th>
                  <th className="py-2.5 px-3">Praça Origem</th>
                  <th className="py-2.5 px-3 text-right">Valor Total</th>
                  <th className="py-2.5 px-3 text-right">Taxa Central</th>
                  <th className="py-2.5 px-3 text-right">Líquido Motorista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-cyan-400">
                      {d.code || `#${d.codigo}`}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(d.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 text-white">
                      {d.passageiro_nome || d.merchantName}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {d.mototaxista_nome || d.courierName || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {d.praca_origem_nome || d.pracaZoneName || 'Centro'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      R$ {(d.valor_corrida || d.deliveryFee || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      R$ {(d.valor_destinado_central || d.centralFee || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-300">
                      R$ {(d.valor_liquido_mototaxista || d.courierEarnings || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
