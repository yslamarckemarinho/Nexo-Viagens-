import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Praca } from '../../types';
import {
  MapPin,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  Users,
  Search,
  Sparkles,
  Shield,
  Navigation,
  X,
  Check,
} from 'lucide-react';

export const AdminPracasTab: React.FC = () => {
  const { pracas, adicionarPraca, editarPraca, togglePracaStatus, couriers } = useApp();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPraca, setEditingPraca] = useState<Praca | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [enderecoReferencia, setEnderecoReferencia] = useState('');
  const [latitude, setLatitude] = useState('-6.9535');
  const [longitude, setLongitude] = useState('-35.5463');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredPracas = pracas.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.endereco_referencia.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingPraca(null);
    setNome('');
    setEnderecoReferencia('');
    setLatitude('-6.9535');
    setLongitude('-35.5463');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Praca) => {
    setEditingPraca(p);
    setNome(p.nome);
    setEnderecoReferencia(p.endereco_referencia);
    setLatitude(String(p.latitude || -6.9535));
    setLongitude(String(p.longitude || -35.5463));
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!nome.trim()) {
      setFormError('Informe o nome da praça.');
      return;
    }
    if (!enderecoReferencia.trim()) {
      setFormError('Informe a localização ou ponto de referência.');
      return;
    }

    if (editingPraca) {
      editarPraca(editingPraca.id, {
        nome: nome.trim(),
        endereco_referencia: enderecoReferencia.trim(),
        latitude: parseFloat(latitude) || -6.9535,
        longitude: parseFloat(longitude) || -35.5463,
      });
    } else {
      adicionarPraca(
        nome.trim(),
        enderecoReferencia.trim(),
        parseFloat(latitude) || -6.9535,
        parseFloat(longitude) || -35.5463
      );
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" /> Gestão Territorial de Alagoinha-PB
          </div>
          <h2 className="text-xl font-black text-white">Praças de Mototáxi</h2>
          <p className="text-xs text-slate-400">
            Cadastre e controle quantas praças forem necessárias à medida que a cidade expande.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nova Praça
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar praça por nome ou endereço..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Pracas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPracas.map((praca) => {
          // Mototaxistas nesta praça
          const vinculados = couriers.filter(
            (c) => c.assignedZoneId === praca.id || c.praca_atual_id === praca.id
          ).length;
          const disponiveis = couriers.filter(
            (c) =>
              (c.assignedZoneId === praca.id || c.praca_atual_id === praca.id) &&
              (c.disponibilidade === 'disponivel' || c.isOnline) &&
              (c.status_aprovacao === 'aprovado' || c.isApproved)
          ).length;

          return (
            <div
              key={praca.id}
              className={`p-5 rounded-3xl border transition-all ${
                praca.ativa
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/60 border-red-900/30 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">{praca.nome}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-slate-500" />
                      {praca.endereco_referencia}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    praca.ativa
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                  }`}
                >
                  {praca.ativa ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              {/* Badges / Mototaxistas count */}
              <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Vinculados
                  </span>
                  <span className="text-lg font-black text-slate-200">{vinculados}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                    Disponíveis Agora
                  </span>
                  <span className="text-lg font-black text-emerald-400">{disponiveis}</span>
                </div>
              </div>

              {/* Coordinates */}
              {praca.latitude && praca.longitude && (
                <p className="text-[11px] text-slate-500 mb-4 font-mono">
                  Coord: {praca.latitude.toFixed(4)}, {praca.longitude.toFixed(4)}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => togglePracaStatus(praca.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    praca.ativa
                      ? 'bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300'
                      : 'bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300'
                  }`}
                >
                  {praca.ativa ? 'Desativar' : 'Reativar'}
                </button>
                <button
                  onClick={() => handleOpenEdit(praca)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">
                {editingPraca ? 'Editar Praça' : 'Cadastrar Nova Praça'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome da Praça *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Praça Central (Barão do Rio Branco)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Localização / Endereço de Referência *
                </label>
                <input
                  type="text"
                  value={enderecoReferencia}
                  onChange={(e) => setEnderecoReferencia(e.target.value)}
                  placeholder="Ex: Próximo à Matriz de Alagoinha"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-6.9535"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="-35.5463"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm cursor-pointer hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Check className="w-4 h-4" /> Salvar Praça
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
