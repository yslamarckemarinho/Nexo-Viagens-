import React, { useState } from 'react';
import { AlertOctagon, Phone, ShieldAlert, X, Copy, Check, ExternalLink } from 'lucide-react';
import { Delivery, TipoUsuario } from '../../types';
import { tocarAlertaSos } from '../../utils/notifications';

interface RideSosModalProps {
  delivery: Delivery;
  currentUserId: string;
  currentUserRole: TipoUsuario;
  currentUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onTriggerSos: (motivo?: string) => void;
}

export const RideSosModal: React.FC<RideSosModalProps> = ({
  delivery,
  currentUserId,
  currentUserRole,
  currentUserName,
  isOpen,
  onClose,
  onTriggerSos,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSosActive, setIsSosActive] = useState(Boolean(delivery.sos_acionado));

  if (!isOpen) return null;

  const handleAcionar = () => {
    tocarAlertaSos();
    setIsSosActive(true);
    onTriggerSos('SOS Acionado pelo usuário durante a corrida urbana');
  };

  const emergencyMessage = `🚨 ALERTA SOS - NEXO VIAGENS ALAGOINHA-PB
Corrida: ${delivery.code || `#${delivery.codigo}`}
Passageiro: ${delivery.passageiro_nome || delivery.merchantName} (${delivery.passageiro_telefone || delivery.merchantPhone})
Mototaxista: ${delivery.mototaxista_nome || delivery.courierName} (${delivery.mototaxista_placa || 'Moto'})
Embarque: ${delivery.origem_endereco || delivery.pickupAddress}
Destino: ${delivery.destino_endereco || delivery.deliveryAddress}
Horário: ${new Date().toLocaleTimeString()}
Local: Perímetro Urbano de Alagoinha-PB`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emergencyMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Central de Emergência SOS</h3>
              <p className="text-xs text-rose-400 font-medium">Segurança em Alagoinha-PB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SOS Button or Triggered State */}
        {!isSosActive ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Se você está em situação de perigo, acidente ou ameaça durante esta corrida, acione o SOS abaixo. A Central Nexo Viagens registrará o alerta com alta prioridade.
            </p>

            <button
              onClick={handleAcionar}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/40 transition-transform active:scale-95 cursor-pointer"
            >
              <AlertOctagon className="w-6 h-6" />
              <span>Acionar SOS na Central Agora</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
              SOS Ativo na Corrida
            </div>
            <p className="text-xs text-rose-200">
              O alerta foi registrado no painel da Central e no histórico de auditoria com os dados desta viagem.
            </p>
          </div>
        )}

        {/* Direct Emergency Dials */}
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Telefones de Emergência Imediata:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:190"
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-center flex items-center justify-center gap-2 text-xs font-bold text-cyan-400 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Polícia (190)</span>
            </a>
            <a
              href="tel:192"
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-center flex items-center justify-center gap-2 text-xs font-bold text-rose-400 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>SAMU (192)</span>
            </a>
          </div>
        </div>

        {/* Copy Ride Data for WhatsApp or Family */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              Compartilhar dados da corrida com parentes:
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Dados</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono line-clamp-3">
            {emergencyMessage}
          </div>
        </div>
      </div>
    </div>
  );
};
