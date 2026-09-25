import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Send,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Users,
  Car,
  Radio,
} from 'lucide-react';
import { BroadcastAlert } from '../../types';

export const AdminBroadcastTab: React.FC = () => {
  const { broadcastAlerts, criarBroadcastAlert, removerBroadcastAlert } = useApp();

  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [nivel, setNivel] = useState<'informativo' | 'alerta' | 'urgente'>('informativo');
  const [publicoAlvo, setPublicoAlvo] = useState<'todos' | 'motoristas' | 'passageiros'>('todos');
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) return;

    criarBroadcastAlert({
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      nivel,
      publico_alvo: publicoAlvo,
      criado_por: 'Central Nexo Alagoinha',
      ativo: true,
    });

    setTitulo('');
    setMensagem('');
    setNivel('informativo');
    setPublicoAlvo('todos');
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Central de Mensagens Broadcast & Alertas Gerais</h2>
            <p className="text-xs text-slate-400">
              Envie avisos em tempo real diretamente para as telas de passageiros e mototaxistas em Alagoinha (ex: chuva forte, eventos na praça, tarifas especiais ou avisos de trânsito).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Criação de Alerta */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span>Criar Novo Comunicado</span>
          </h3>

          {sucesso && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Comunicado transmitido com sucesso para a rede!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Título do Comunicado *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Chuva Intensa em Alagoinha • Redobre a Atenção"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Público-Alvo
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'motoristas', label: 'Motoristas' },
                  { id: 'passageiros', label: 'Passageiros' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPublicoAlvo(item.id as any)}
                    className={`py-2 px-1 rounded-xl text-center font-bold text-[11px] border cursor-pointer transition-all ${
                      publicoAlvo === item.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nível de Urgência
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'informativo', label: 'Info (Azul)', color: 'text-cyan-400' },
                  { id: 'alerta', label: 'Alerta (Amarelo)', color: 'text-amber-400' },
                  { id: 'urgente', label: 'Urgente (Vermelho)', color: 'text-rose-400' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNivel(item.id as any)}
                    className={`py-2 px-1 rounded-xl text-center font-bold text-[10px] border cursor-pointer transition-all ${
                      nivel === item.id
                        ? 'bg-slate-800 border-white text-white ring-1 ring-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={item.color}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Mensagem Completa *
              </label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Ex: Devido à chuva e pista escorregadia na saída para Cuitegi, dirija com cautela e aumente a distância de segurança..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Transmitir para Todos Agora</span>
            </button>
          </form>
        </div>

        {/* Lista de Alertas Ativos */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Comunicados no Ar ({broadcastAlerts ? broadcastAlerts.length : 0})</span>
            </h3>
            <span className="text-xs text-slate-400">Visíveis nos portais em tempo real</span>
          </div>

          {(!broadcastAlerts || broadcastAlerts.length === 0) ? (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
              Nenhum comunicado ativo no momento. Use o formulário ao lado para emitir alertas instantâneos.
            </div>
          ) : (
            <div className="space-y-3">
              {broadcastAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    alert.nivel === 'urgente'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : alert.nivel === 'alerta'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-cyan-950/20 border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          alert.nivel === 'urgente'
                            ? 'bg-rose-500/30 text-rose-300'
                            : alert.nivel === 'alerta'
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-cyan-500/30 text-cyan-300'
                        }`}
                      >
                        {alert.nivel}
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                        Público: {alert.publico_alvo}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {new Date(alert.criado_em).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(alert.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removerBroadcastAlert(alert.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Excluir comunicado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{alert.titulo}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">{alert.mensagem}</p>
                  </div>

                  <div className="pt-1 text-[10px] text-slate-500">
                    Emitido por: {alert.criado_por}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
