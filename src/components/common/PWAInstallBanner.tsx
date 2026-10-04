import React, { useState } from 'react';
import { usePWAInstall } from '../../utils/usePWAInstall';
import { Download, Share, PlusSquare, Check, X, Smartphone } from 'lucide-react';

interface PWAInstallBannerProps {
  compact?: boolean;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Se já está instalado como app ou foi dispensado na sessão, não exibe
  if (isInstalled || dismissed) {
    return null;
  }

  // Versão compacta para Header ou barra de status
  if (compact) {
    if (isInstallable) {
      return (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md transition-all transform active:scale-95 cursor-pointer"
          title="Baixar e instalar o Nexo Viagens direto no celular"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Baixar App</span>
        </button>
      );
    }

    if (isIOS) {
      return (
        <>
          <button
            onClick={() => setShowIOSModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition-colors cursor-pointer"
            title="Instalar no iPhone"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instalar no iPhone</span>
          </button>

          {showIOSModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl space-y-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-base font-black">Instalar no seu iPhone</h3>
                  </div>
                  <button
                    onClick={() => setShowIOSModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Para deixar o aplicativo leve, sem barras e abrir instantaneamente no seu celular:
                </p>

                <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                      1
                    </div>
                    <p className="text-slate-200">
                      Toque no botão <strong className="text-white">Compartilhar</strong> (ícone de quadrado com seta para cima <Share className="w-3.5 h-3.5 inline mx-1 text-cyan-400" />) na barra inferior do Safari.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                      2
                    </div>
                    <p className="text-slate-200">
                      Role para baixo e selecione <strong className="text-white">"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                      3
                    </div>
                    <p className="text-slate-200">
                      Toque em <strong className="text-emerald-400">Adicionar</strong> no canto superior direito. Pronto! O app fica salvo na sua tela.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
                >
                  Entendi, vou adicionar!
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    return null;
  }

  // Banner flutuante no rodapé ou no topo
  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border border-cyan-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
          <Smartphone className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-white">
              Instale o App Nexo Viagens no seu Celular
            </span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Mais Leve & Rápido
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Economize dados de internet, receba notificações sonoras e use o GPS em tela cheia sem barra de navegador.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
        {isInstallable && (
          <button
            onClick={install}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50 cursor-pointer transition-all transform active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Instalar no Celular</span>
          </button>
        )}

        {isIOS && (
          <button
            onClick={() => setShowIOSModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Share className="w-4 h-4 text-cyan-400" />
            <span>Instalar no iPhone</span>
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-cyan-400" />
                <h3 className="text-base font-black">Instalar no seu iPhone</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              No Safari da Apple, você pode fixar o aplicativo diretamente na sua tela inicial:
            </p>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <p className="text-slate-200">
                  Toque no ícone de <strong className="text-white">Compartilhar</strong> (<Share className="w-3.5 h-3.5 inline mx-1 text-cyan-400" />) na barra inferior do Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <p className="text-slate-200">
                  Role a lista e toque em <strong className="text-white">"Adicionar à Tela de Início"</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <p className="text-slate-200">
                  Toque em <strong className="text-emerald-400">Adicionar</strong>. O app abrirá em tela cheia como se fosse baixado da App Store!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
            >
              OK, Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
