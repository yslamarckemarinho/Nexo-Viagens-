import { Delivery } from '../types';

/**
 * Normaliza número de telefone para o padrão do WhatsApp (DDI 55 + DDD + Número)
 */
export function cleanWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.length === 12 || digits.length === 13) {
    return digits;
  }
  return `55${digits}`;
}

/**
 * Gera o link direto de navegação no Google Maps com rota para Alagoinha-PB
 */
export function generateMapsNavigationUrl(address: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const fullAddress = address.toLowerCase().includes('alagoinha')
    ? address
    : `${address}, Alagoinha - PB`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
}

/**
 * Gera o link direto de navegação no Waze
 */
export function generateWazeNavigationUrl(address: string, lat?: number, lng?: number): string {
  if (lat && lng) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }
  const fullAddress = address.toLowerCase().includes('alagoinha')
    ? address
    : `${address}, Alagoinha - PB`;
  return `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}&navigate=yes`;
}

/**
 * Mensagem automática para o CLIENTE FINAL / PASSAGEIRO com o PIN de confirmação
 */
export function generateCustomerWhatsAppUrl(params: {
  delivery: Delivery;
  merchantName: string;
}): string {
  const { delivery } = params;
  const phone = cleanWhatsAppNumber(delivery.customerPhone || '');
  if (!phone) return '';

  const pinText = delivery.pinCode
    ? `\n🔑 *SEU CÓDIGO DE CONFIRMAÇÃO (PIN / U-Código):* *${delivery.pinCode}*\n_(Por favor, informe estes 4 dígitos ao motorista no embarque ou conclusão)_\n`
    : '';

  const paymentText = `\n💳 *Pagamento:* Débito em Créditos na Central Nexo Viagens (Já pago)`;

  const driverText = delivery.courierName
    ? `\n🚗 *Motorista Parceiro:* ${delivery.courierName} ${delivery.courierPhone ? `(${delivery.courierPhone})` : ''}`
    : '\n🚗 *Motorista:* A caminho';

  const message = `👋 Olá${delivery.customerName ? ` *${delivery.customerName}*` : ''}! Tudo bem?
  
Sua viagem via *Nexo Viagens* está confirmada! 🚗💨
${driverText}
📍 *Ponto de Partida / Embarque:* ${delivery.pickupAddress}
🏁 *Destino:* ${delivery.deliveryAddress}
${paymentText}
${pinText}
Desejamos uma ótima e segura viagem! ✨`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Mensagem automática completa para o CONDUTOR / MOTORISTA PARCEIRO
 * Contém dados da rota, link do Google Maps e aviso do PIN
 */
export function generateCourierDispatchWhatsAppUrl(params: {
  delivery: Delivery;
  courierPhone?: string;
}): string {
  const { delivery, courierPhone } = params;
  const phone = cleanWhatsAppNumber(courierPhone || delivery.courierPhone || '');
  const mapsLink = generateMapsNavigationUrl(delivery.deliveryAddress);

  const cobrancaText = '✅ Pago via Créditos da Central Nexo Viagens (Repasse automático garantido)';

  const feeText = delivery.isRural && delivery.ruralAgreedDirectly
    ? '🌾 A Combinar Direto com o Solicitante'
    : `R$ ${delivery.courierEarnings ? delivery.courierEarnings.toFixed(2) : delivery.deliveryFee.toFixed(2)}`;

  const message = `🚗 *NEXO VIAGENS - CORRIDA DE PASSAGEIRO*
🆔 Viagem: *${delivery.code}*

📍 *EMBARQUE (Buscar o Passageiro):*
${delivery.pickupAddress}
👤 Passageiro: ${delivery.customerName || delivery.merchantName || 'Passageiro'}
${delivery.customerPhone ? `📞 Tel/Zap: ${delivery.customerPhone}` : ''}
${delivery.passengerCount ? `👥 Pessoas: ${delivery.passengerCount}` : ''}

🏁 *DESEMBARQUE (Destino):*
📍 ${delivery.deliveryAddress}

🗺️ *Abrir GPS / Google Maps:*
${mapsLink}

💰 *Seu Ganho:* ${feeText}
💵 *Pagamento:* ${cobrancaText}

🔑 *PIN DE SEGURANÇA (U-Código):* O passageiro possui um código de 4 dígitos para conferência.
${delivery.observations ? `\n📝 *Obs:* ${delivery.observations}` : ''}

Tenha uma excelente e segura viagem! 🚗💨`;

  if (!phone) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
