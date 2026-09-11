// Utilitário de Notificações Sonoras e Web Push para Alagoinha-PB
export async function solicitarPermissaoNotificacao(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações de desktop.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function enviarNotificacaoWeb(titulo: string, opcoes?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(titulo, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'nexo-viagem-alert',
      vibrate: [200, 100, 200],
      ...opcoes,
    } as any);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.error('Erro ao disparar notificação Web:', err);
  }
}

// Chime de áudio sintetizado para chamados de mototáxi (independente de arquivos externos)
export function tocarAlertaChamado() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Tom agradável e chamativo: 660Hz -> 880Hz
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.25);
    osc.frequency.exponentialRampToValueAtTime(987, ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.65);
  } catch (e) {
    console.warn('Alerta sonoro não pôde ser reproduzido:', e);
  }
}

// Alerta de emergência SOS
export function tocarAlertaSos() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.setValueAtTime(450, ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(900, ctx.currentTime + 0.4);
    osc.frequency.setValueAtTime(450, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  } catch (e) {
    console.warn('Alerta sonoro SOS não reproduzido:', e);
  }
}
