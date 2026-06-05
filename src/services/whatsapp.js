import axios from 'axios';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = 'XXXXXXXXXX';
const WHATSAPP_TOKEN = 'YOUR_WHATSAPP_TOKEN';

const whatsappClient = axios.create({
  baseURL: `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}`,
  headers: {
    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await whatsappClient.post('/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: message },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendAppointmentConfirmation = async (phone, cliente, fecha, hora) => {
  const message = `Hola ${cliente}, ✅ *Cita Confirmada*\n\n` +
    `Estimado(a) ${cliente}, su cita con *Arauz Carrillo Abogados* ha sido confirmada.\n\n` +
    `📅 *Fecha:* ${fecha}\n⏰ *Hora:* ${hora}\n📍 *Lugar:* Oficina Central\n\n` +
    `Si necesita reagendar, contáctenos al +507 0000-0000.\n\n` +
    `*Arauz Carrillo Abogados* - Su confianza, nuestro compromiso.`;
  return sendWhatsAppMessage(phone, message);
};

export const sendPaymentReminder = async (phone, cliente, monto, fechaVencimiento) => {
  const message = `🔔 *Recordatorio de Pago*\n\n` +
    `Hola ${cliente}, le recordamos que tiene un pago pendiente:\n\n` +
    `💰 *Monto:* B/. ${monto}\n📅 *Vence:* ${fechaVencimiento}\n\n` +
    `Realice su pago para evitar cargos adicionales.\n\n` +
    `*Arauz Carrillo Abogados*`;
  return sendWhatsAppMessage(phone, message);
};

export const sendCaseUpdate = async (phone, cliente, expediente, estado) => {
  const message = `⚖️ *Actualización de Expediente*\n\n` +
    `Hola ${cliente}, su expediente *${expediente}* ha sido actualizado.\n\n` +
    `📋 *Nuevo estado:* ${estado}\n\n` +
    `Para más detalles, contáctenos.\n\n` +
    `*Arauz Carrillo Abogados*`;
  return sendWhatsAppMessage(phone, message);
};

export const sendInvoiceNotification = async (phone, cliente, factura, monto) => {
  const message = `🧾 *Nueva Factura*\n\n` +
    `Hola ${cliente}, se ha generado una nueva factura:\n\n` +
    `📄 *Factura:* ${factura}\n💰 *Monto:* B/. ${monto}\n\n` +
    `Puede realizar su pago por transferencia bancaria o en nuestras oficinas.\n\n` +
    `*Arauz Carrillo Abogados*`;
  return sendWhatsAppMessage(phone, message);
};

export const sendWelcomeMessage = async (phone, nombre) => {
  const message = `🎉 *Bienvenido a Arauz Carrillo Abogados*\n\n` +
    `Hola ${nombre}, gracias por confiar en nosotros.\n\n` +
    `A partir de ahora recibirá notificaciones sobre:\n` +
    `✅ Confirmación de citas\n` +
    `🔔 Recordatorios de pagos\n` +
    `⚖️ Actualizaciones de sus expedientes\n` +
    `🧾 Notificaciones de facturas\n\n` +
    `*Arauz Carrillo Abogados* - Su confianza, nuestro compromiso.`;
  return sendWhatsAppMessage(phone, message);
};

export const getChatbotResponse = async (message) => {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('horario') || lowerMsg.includes('horarios')) {
    return 'Nuestro horario de atención es:\n' +
      'Lunes a Viernes: 8:00 AM - 5:00 PM\n' +
      'Sábados: 9:00 AM - 12:00 PM\n' +
      'Domingos: Cerrado';
  }

  if (lowerMsg.includes('direcci') || lowerMsg.includes('ubicaci')) {
    return '📍 Estamos ubicados en:\n' +
      'Vía España, Edificio Arauz Carrillo\n' +
      'Piso 8, Oficina 801\n' +
      'Ciudad de Panamá, Panamá';
  }

  if (lowerMsg.includes('contacto') || lowerMsg.includes('teléfono') || lowerMsg.includes('telefono')) {
    return '📞 Puede contactarnos:\n' +
      'Teléfono: +507 0000-0000\n' +
      'WhatsApp: +507 0000-0000\n' +
      'Email: info@arauzcarrillo.com';
  }

  if (lowerMsg.includes('cita') || lowerMsg.includes('agendar')) {
    return 'Para agendar una cita, por favor proporcione:\n' +
      '1. Nombre completo\n' +
      '2. Número de cédula\n' +
      '3. Motivo de la consulta\n' +
      '4. Día y hora preferida\n\n' +
      'O puede llamarnos directamente al +507 0000-0000.';
  }

  if (lowerMsg.includes('cobro') || lowerMsg.includes('pago') || lowerMsg.includes('factura')) {
    return '💰 Sobre cobros y facturación:\n\n' +
      'Aceptamos los siguientes métodos de pago:\n' +
      '• Transferencia bancaria\n' +
      '• Tarjeta de crédito/débito\n' +
      '• Efectivo\n' +
      '• Yappy\n\n' +
      'Para consultar su saldo pendiente, responda con su número de cédula.';
  }

  if (lowerMsg.includes('expediente') || lowerMsg.includes('caso')) {
    return '⚖️ Sobre su expediente:\n\n' +
      'Para consultar el estado de su expediente, necesita:\n' +
      '• Número de expediente\n' +
      '• Su número de cédula\n\n' +
      'O puede contactar directamente a su abogado asignado.';
  }

  if (lowerMsg.includes('abogado') || lowerMsg.includes('licenciado')) {
    return '👔 Nuestro equipo está conformado por abogados especializados en:\n' +
      '• Derecho Civil\n' +
      '• Derecho Penal\n' +
      '• Derecho Laboral\n' +
      '• Derecho Comercial\n' +
      '• Derecho Administrativo\n\n' +
      '¿En qué área necesita asistencia?';
  }

  return '🤖 Gracias por contactar a *Arauz Carrillo Abogados*.\n\n' +
    'Puedo ayudarle con:\n' +
    '• 📅 Agendar citas\n' +
    '• ⚖️ Consultar expedientes\n' +
    '• 💰 Información de cobros\n' +
    '• 📋 Horarios y dirección\n' +
    '• 👔 Información del equipo\n\n' +
    '¿En qué puedo ayudarle?';
};
