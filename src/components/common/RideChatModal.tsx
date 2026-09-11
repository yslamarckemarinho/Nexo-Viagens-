import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Check, Clock } from 'lucide-react';
import { Delivery, MensagemChat, TipoUsuario } from '../../types';

interface RideChatModalProps {
  delivery: Delivery;
  currentUserId: string;
  currentUserType: TipoUsuario;
  currentUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (texto: string, rapida?: boolean) => void;
}

const QUICK_PRESETS_PASSENGER = [
  'Estou no portão aguardando',
  'Qual o modelo da moto?',
  'Estou de blusa preta na calçada',
  'Pode buzinar quando chegar!',
  'Já estou descendo!',
];

const QUICK_PRESETS_MOTOTAXISTA = [
  'Chego em 2 minutos!',
  'Estou no local de embarque!',
  'Estou com capacete higienizado',
  'Pode vir, estou de moto na esquina',
  'Trânsito um pouco lento, já chego',
];

export const RideChatModal: React.FC<RideChatModalProps> = ({
  delivery,
  currentUserId,
  currentUserType,
  currentUserName,
  isOpen,
  onClose,
  onSendMessage,
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages: MensagemChat[] = delivery.mensagens_chat || [];

  const presets =
    currentUserType === 'passageiro'
      ? QUICK_PRESETS_PASSENGER
      : QUICK_PRESETS_MOTOTAXISTA;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim(), false);
    setText('');
  };

  const handleQuickSend = (preset: string) => {
    onSendMessage(preset, true);
  };

  const otherPersonName =
    currentUserType === 'passageiro'
      ? delivery.mototaxista_nome || delivery.courierName || 'Mototaxista'
      : delivery.passageiro_nome || delivery.merchantName || 'Passageiro';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg h-[85vh] sm:h-[600px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">{otherPersonName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                  Corrida {delivery.code || `#${delivery.codigo}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Chat rápido sem expor seu WhatsApp pessoal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-cyan-400" />
              <p className="text-sm font-medium text-slate-400">Nenhuma mensagem ainda</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Envie uma mensagem rápida abaixo para combinar os detalhes do embarque na cidade.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.remetente_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isMe ? 'Você' : msg.remetente_nome}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {new Date(msg.enviada_em).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs font-medium ${
                      isMe
                        ? 'bg-cyan-600 text-white rounded-tr-sm shadow-md shadow-cyan-600/20'
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                    }`}
                  >
                    {msg.texto}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Presets Carousel */}
        <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider px-1">
            Rápidas:
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickSend(preset)}
              className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-cyan-600 hover:text-white border border-slate-700 hover:border-cyan-500 text-slate-300 transition-colors cursor-pointer shrink-0"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Mensagem para ${otherPersonName}...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
