/**
 * ============================================================================
 * GOOGLE APPS SCRIPT PARA RECIBIR CONFIRMACIONES (RSVP) EN GOOGLE SHEETS
 * ============================================================================
 * Cómo usarlo (5 pasos):
 * 1. Crea una Hoja de cálculo en Google Sheets (ej. "Invitados Boda 2027").
 * 2. Ve a Extensiones -> Apps Script y pega este código completo.
 * 3. Cambia COUPLE_EMAIL y COUPLE_NAMES abajo si quieres recibir avisos por email.
 * 4. Pulsa "Implementar" -> "Nueva implementación" -> Tipo: "Aplicación web".
 *    - Ejecutar como: "Yo"
 *    - Quién tiene acceso: "Cualquier usuario"
 * 5. Copia la URL que termina en /exec, pégala en js/config.js -> rsvp.appsScript.webAppUrl
 *    y cambia rsvp.backendMode a 'apps-script'.
 */

var SHEET_NAME = 'Respuestas RSVP';
var COUPLE_EMAIL = ''; // Ej: 'boda@malenayfer.es' (déjalo vacío si no quieres email de aviso)
var COUPLE_NAMES = 'Malena & Fer';
var WEDDING_DATE_TEXT = '18 de septiembre de 2027 · Finca El Olivar (Murcia)';

var HEADERS = [
  'Fecha de registro',
  'Nombre invitado',
  'Email / Teléfono',
  'Asistencia',
  'Lleva acompañante',
  'Nombre acompañante',
  'Número de niños',
  'Detalle niños',
  'Menú principal',
  'Menú acompañante',
  'Alergias / Dieta',
  'Necesita autobús',
  'Nivel fiesta (1-5)',
  'Descripción fiesta',
  'Canción DJ',
  'Mensaje para los novios',
  'Intentos botón No',
  'Código Pase VIP'
];

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sendGuestConfirmationEmail_(data) {
  if (!data.email || data.email.indexOf('@') === -1) return;

  var isYes = data.attendance === 'Sí';
  var subject = isYes
    ? '🥂 ¡Confirmado! Tu Pase VIP para la boda de ' + COUPLE_NAMES
    : '💛 Gracias por avisarnos · Boda de ' + COUPLE_NAMES;

  var htmlBody = isYes
    ? '<div style="font-family:Georgia,serif;color:#23201C;background:#FAF7F2;padding:28px;border:1px solid #C5A059;border-radius:12px;">' +
        '<h2 style="color:#3E4C37;margin-top:0;">¡Qué alegría contar contigo, ' + escapeHtml_(data.name) + '!</h2>' +
        '<p>Hemos guardado tu confirmación para nuestra boda (<strong>' + WEDDING_DATE_TEXT + '</strong>).</p>' +
        '<ul>' +
          '<li><strong>Menú:</strong> ' + escapeHtml_(data.menu) + (data.hasPlusOne ? ' (+1: ' + escapeHtml_(data.plusOneMenu) + ')' : '') + '</li>' +
          (data.childrenCount > 0 ? '<li><strong>Niños (' + escapeHtml_(data.childrenCount) + '):</strong> ' + escapeHtml_(data.childrenDetails) + '</li>' : '') +
          '<li><strong>Alergias:</strong> ' + escapeHtml_(data.allergies || 'Ninguna') + '</li>' +
          '<li><strong>Autobús:</strong> ' + (data.bus ? 'Sí, plaza reservada' : 'No necesario') + '</li>' +
          '<li><strong>Petición DJ:</strong> ' + escapeHtml_(data.song || 'Sorpresa del DJ') + '</li>' +
          '<li><strong>Código de Pase VIP:</strong> ' + escapeHtml_(data.passCode || 'LM-2027') + '</li>' +
        '</ul>' +
        '<p style="margin-bottom:0;">¡Nos vemos en la pista de baile!<br><em>' + COUPLE_NAMES + '</em></p>' +
      '</div>'
    : '<div style="font-family:Georgia,serif;color:#23201C;background:#FAF7F2;padding:28px;border:1px solid #C5A059;border-radius:12px;">' +
        '<h2 style="color:#3E4C37;margin-top:0;">Hola, ' + escapeHtml_(data.name) + '</h2>' +
        '<p>Hemos recibido tu respuesta. Sentiremos mucho no verte ese día, pero brindaremos a tu salud.</p>' +
        '<p style="margin-bottom:0;">Un abrazo enorme,<br><em>' + COUPLE_NAMES + '</em></p>' +
      '</div>';

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: htmlBody
  });
}

function sendCoupleNotificationEmail_(data) {
  if (!COUPLE_EMAIL) return;

  var subject = '[RSVP Boda] ' + data.name + ' -> ' + data.attendance;
  var body =
    'Nueva respuesta recibida:\n\n' +
    'Nombre: ' + data.name + '\n' +
    'Contacto: ' + data.email + '\n' +
    'Asistencia: ' + data.attendance + '\n' +
    'Acompañante: ' + (data.hasPlusOne ? data.plusOneName : 'No') + '\n' +
    'Niños: ' + (data.childrenCount > 0 ? data.childrenCount + ' (' + (data.childrenDetails || '-') + ')' : 'No') + '\n' +
    'Menú: ' + (data.menu || '-') + (data.hasPlusOne ? ' / +1: ' + data.plusOneMenu : '') + '\n' +
    'Alergias: ' + (data.allergies || '-') + '\n' +
    'Autobús: ' + (data.bus ? 'Sí' : 'No') + '\n' +
    'Nivel fiesta: ' + (data.partyLabel || '-') + '\n' +
    'Canción DJ: ' + (data.song || '-') + '\n' +
    'Intentos botón No: ' + (data.noAttempts || 0) + '\n' +
    'Mensaje: ' + (data.message || '-') + '\n';

  MailApp.sendEmail(COUPLE_EMAIL, subject, body);
}

function escapeHtml_(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var payload = JSON.parse(e.postData.contents || '{}');
    var sheet = getOrCreateSheet_();

    sheet.appendRow([
      new Date(),
      payload.name || '',
      payload.email || '',
      payload.attendance || '',
      payload.hasPlusOne ? 'Sí' : 'No',
      payload.plusOneName || '',
      payload.childrenCount || 0,
      payload.childrenDetails || '',
      payload.menu || '',
      payload.plusOneMenu || '',
      payload.allergies || '',
      payload.bus ? 'Sí' : 'No',
      payload.partyLevel || '',
      payload.partyLabel || '',
      payload.song || '',
      payload.message || '',
      payload.noAttempts || 0,
      payload.passCode || ''
    ]);

    try {
      sendGuestConfirmationEmail_(payload);
      sendCoupleNotificationEmail_(payload);
    } catch (mailErr) {
      // No fallar el registro si hubiera límite diario de correos
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', passCode: payload.passCode || '' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ready', service: 'Wedding RSVP Web App' }))
    .setMimeType(ContentService.MimeType.JSON);
}
