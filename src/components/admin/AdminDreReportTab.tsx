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
  Car,
  QrCode,
  Copy,
  Check,
  Send,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminDreReportTab: React.FC = () => {
  const { deliveries, settings, couriers } = useApp();
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'tudo'>('mes');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [settledDriverIds, setSettledDriverIds] = useState<Record<string, boolean>>({});

  // Filtrar corridas concluídas (suportando status 'corrida_concluida' ou 'concluida')
  const completedDeliveries = deliveries.filter(
    (d) => d.status === 'corrida_concluida' || d.status === 'concluida'
  );

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

  // Fechamento individual por Motorista / Piloto
  const driverBreakdown = couriers.map((courier) => {
    const courierRides = filteredDeliveries.filter(
      (d) => d.courierId === courier.id || d.mototaxista_id === courier.id || d.courierName === courier.name
    );
    const ridesCount = courierRides.length;
    const grossTotal = courierRides.reduce(
      (acc, d) => acc + (d.valor_corrida || d.deliveryFee || 0),
      0
    );
    const centralCommission = courierRides.reduce(
      (acc, d) => acc + (d.valor_destinado_central || d.centralFee || 0),
      0
    );
    const netEarnings = courierRides.reduce(
      (acc, d) => acc + (d.valor_liquido_mototaxista || d.courierEarnings || 0),
      0
    );

    return {
      courier,
      ridesCount,
      grossTotal,
      centralCommission,
      netEarnings,
      isSettled: !!settledDriverIds[courier.id],
    };
  }).filter((item) => item.ridesCount > 0 || item.courier.active);

  const handleCopyPix = (pixKey: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(pixKey);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleToggleSettled = (courierId: string) => {
    setSettledDriverIds((prev) => ({
      ...prev,
      [courierId]: !prev[courierId],
    }));
  };

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

      {/* NOVA SEÇÃO: FECHAMENTO DE REPASSES POR MOTORISTA / PILOTO */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Fechamento Individual por Motorista Parceiro</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  {driverBreakdown.length} pilotos
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Resumo de corridas, taxas da Central retidas e chave Pix para pagamento dos pilotos
              </p>
            </div>
          </div>
        </div>

        {driverBreakdown.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Nenhum motorista com viagens no período selecionado.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {driverBreakdown.map((item) => {
              const { courier, ridesCount, grossTotal, centralCommission, netEarnings, isSettled } = item;
              return (
                <div
                  key={courier.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isSettled
                      ? 'bg-slate-950/50 border-emerald-500/40 opacity-90'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {courier.photoUrl ? (
                        <img
                          src={courier.photoUrl}
                          alt={courier.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {courier.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{courier.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {courier.phone} • {courier.vehiclePlate || 'Moto'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSettled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isSettled ? 'Fechado / Pago' : 'Aberto'}
                    </span>
                  </div>

                  {/* Resumo Financeiro do Piloto */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-900 border border-slate-850 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Corridas</span>
                      <span className="font-black text-white text-xs">{ridesCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Central</span>
                      <span className="font-bold text-cyan-400 text-xs">
                        R$ {centralCommission.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Líquido</span>
                      <span className="font-black text-amber-300 text-xs">
                        R$ {netEarnings.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Chave Pix do Piloto */}
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex items-center gap-1.5 text-slate-300">
                      <QrCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">
                        {courier.pixKey || courier.phone}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPix(courier.pixKey || courier.phone)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      {copiedKey === (courier.pixKey || courier.phone) ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Pix</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Botão de Fechamento */}
                  <button
                    type="button"
                    onClick={() => handleToggleSettled(courier.id)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isSettled
                        ? 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-750'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSettled ? 'Reabrir Fechamento' : 'Marcar como Acerto Feito / Pago'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
