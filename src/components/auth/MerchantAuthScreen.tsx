import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { NexoLogo } from '../common/NexoLogo';
import {
  ArrowLeft,
  KeyRound,
  Phone,
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  User,
  MapPin,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Camera,
  Upload,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface MerchantAuthScreenProps {
  onBack: () => void;
}

export const MerchantAuthScreen: React.FC<MerchantAuthScreenProps> = ({ onBack }) => {
  const { loginMerchant, cadastrarComercio, settings, merchants } = useApp();

  // Mode: 'register' | 'login'
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('Centro');
  const [regPhoto, setRegPhoto] = useState<string | null>(null);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo selection/upload with compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setRegError('Por favor selecione um arquivo de imagem válido (JPG ou PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para tamanho leve (máximo 400x400 para carregar rápido em 3G/4G)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setRegPhoto(dataUrl);
          setRegError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Bairros populares em Alagoinha para atalhos rápidos
  const popularNeighborhoods = [
    'Centro',
    'Bairro São José',
    'Rua Nova',
    'Bairro Boa Vista',
    'Conjunto Novo',
    'Morro da Cruz',
    'Pátio de Eventos',
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Por favor, informe seu Telefone, E-mail ou Usuário cadastrado.');
      return;
    }

    const res = loginMerchant(loginIdentifier.trim(), loginPassword.trim() || undefined);
    if (!res.success) {
      setLoginError(res.error || 'Erro ao realizar login.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    // Foto obrigatória para segurança do piloto e do passageiro
    if (!regPhoto) {
      setRegError('A foto do rosto do passageiro é obrigatória para segurança mútua da viagem.');
      return;
    }

    if (!regName.trim()) {
      setRegError('Por favor, informe seu Nome Completo.');
      return;
    }

    if (!regPhone.trim()) {
      setRegError('Por favor, informe seu WhatsApp ou Telefone celular.');
      return;
    }

    const digitsOnly = regPhone.replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      setRegError('Telefone inválido. Digite o DDD + número (ex: 83 98822-1133).');
      return;
    }

    if (regPassword.trim().length < 3) {
      setRegError('A senha deve ter pelo menos 3 dígitos.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas digitadas não coincidem. Verifique a confirmação.');
      return;
    }

    const result = cadastrarComercio({
      name: regName.trim(),
      phone: regPhone.trim(),
      address: regAddress.trim() || 'Centro, Alagoinha-PB',
      photoUrl: regPhoto,
      password: regPassword.trim(),
      initialCredit: 0.0,
    });

    if (!result.success) {
      setRegError(result.error || 'Não foi possível cadastrar sua conta. Tente novamente.');
      return;
    }

    // Auto-login efetuado no AppContext com sucesso!
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const centralDigits = settings.centralPhone.replace(/\D/g, '');
  const generalWhatsappUrl = `https://wa.me/55${centralDigits}?text=${encodeURIComponent(
    'Olá Central Nexo Viagens! Preciso de ajuda com meu acesso de passageiro em Alagoinha-PB.'
  )}`;

  const confirmedMerchants = merchants.filter(
    (m) => m.status_cadastro === 'confirmado' || (m.active && m.status_cadastro !== 'pendente')
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <NexoLogo size="sm" variant="light" showSubtitle={false} />
        </div>
      </header>

      {/* Auth Container */}
      <main className="max-w-lg mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {authMode === 'register' ? 'Criar Conta de Passageiro' : 'Acesso do Passageiro'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {authMode === 'register'
                  ? 'Cadastro rápido e seguro com foto facial para identificação'
                  : 'Acesse sua conta para pedir viagens e gerenciar créditos'}
              </p>
            </div>
          </div>

          {/* Tab Selector: Cadastro vs Login */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              id="tab-passageiro-cadastro"
              type="button"
              onClick={() => {
                setAuthMode('register');
                setRegError(null);
                setLoginError(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar Conta Rápida</span>
            </button>
            <button
              id="tab-passageiro-login"
              type="button"
              onClick={() => {
                setAuthMode('login');
                setRegError(null);
                setLoginError(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Já sou Cadastrado</span>
            </button>
          </div>

          {/* 1. ABA DE CADASTRO DO PASSAGEIRO COM FOTO OBRIGATÓRIA */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {/* FOTO FACIAL OBRIGATÓRIA - DESTAQUE VISUAL */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <span>Sua Foto de Perfil</span>
                      <span className="text-cyan-400 font-bold">* (Obrigatória)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Para segurança mútua, o mototaxista verá sua foto ao aceitar a corrida.
                    </p>
                  </div>
                </div>

                {/* Upload / Preview Card */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />

                {regPhoto ? (
                  <div className="flex items-center gap-4 bg-slate-900/90 p-3 rounded-xl border border-emerald-500/40">
                    <img
                      src={regPhoto}
                      alt="Foto do passageiro"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Foto Carregada com Sucesso!
                      </span>
                      <p className="text-[11px] text-slate-400 truncate">
                        Sua foto já está pronta para identificação dos pilotos.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Trocar Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center text-cyan-400 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-white block">
                        Tirar Foto ou Carregar da Galeria
                      </span>
                      <span className="text-[10px] text-cyan-300">
                        Clique aqui para adicionar sua foto de perfil
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome Completo <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-passageiro-cadastro-nome"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: Maria Clara da Silva"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* WhatsApp / Celular */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp / Celular <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-passageiro-cadastro-telefone"
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(formatPhone(e.target.value))}
                    placeholder="(83) 98822-1133"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Usado para login e contato durante as corridas.
                </span>
              </div>

              {/* Bairro / Endereço Frequente */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Bairro / Localidade em Alagoinha
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-passageiro-cadastro-endereco"
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Ex: Centro, Rua Nova, Bairro São José..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {popularNeighborhoods.slice(0, 5).map((bairro) => (
                    <button
                      key={bairro}
                      type="button"
                      onClick={() => setRegAddress(bairro)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        regAddress === bairro
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {bairro}
                    </button>
                  ))}
                </div>
              </div>

              {/* Senha e Confirmação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Criar Senha <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-passageiro-cadastro-senha"
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 3 dígitos"
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirmar Senha <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-passageiro-cadastro-confirmar-senha"
                      type={showPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Concluir Cadastro Imediato */}
              <button
                id="btn-passageiro-submit-cadastro"
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Cadastrar e Começar a Usar</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  Já possui conta? Clique aqui para entrar
                </button>
              </div>
            </form>
          )}

          {/* 2. ABA DE LOGIN DO PASSAGEIRO */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Telefone / WhatsApp ou Usuário
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-comercio-login-user"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="(83) 98888-0000 ou seu nome"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Senha de Acesso
                  </label>
                  <a
                    href={generalWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-comercio-login-pass"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Digite sua senha cadastrada"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <button
                id="btn-comercio-submit-login"
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar no App de Viagens</span>
              </button>

              {/* Botão para mudar para cadastro */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  Ainda não tem conta? Criar conta com foto
                </button>
              </div>
            </form>
          )}

          {/* Suporte da Central */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
              <span>Central Nexo Viagens Alagoinha</span>
            </span>
            <a
              href={generalWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Suporte</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 text-center text-xs text-slate-500">
        Nexo Viagens • Sistema Oficial de Mobilidade em Alagoinha-PB
      </footer>
    </div>
  );
};
