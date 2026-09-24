// ============================================================================
// CONFIGURACIÓN DEL EVENTO — edita este archivo para cambiar fecha, lugar,
// tagline o las opciones de cargo. No necesitas tocar ningún otro archivo.
// Después de guardar, sube el cambio a GitHub y Netlify redesplegará solo.
// ============================================================================
window.NEXUS_CONFIG = {
  eventName: 'Nexus 2026',
  tagline: 'El encuentro del futuro y la excelencia',

  // Texto que se muestra en la landing (edítalo libremente).
  // El evento es virtual (Google Meet, ver "meet" abajo): no tiene ubicación.
  dateLabel: '5 de octubre · 2:00 PM - 6:00 PM',

  // Fecha/hora REAL en formato ISO 8601, usadas por los botones de calendario
  // (Google Calendar y el archivo .ics). El "-05:00" es la zona horaria de
  // Bogotá. Si el evento es en otro país, ajusta el offset.
  // IMPORTANTE: si cambias dateLabel arriba, actualiza también estas dos líneas
  // para que el botón de calendario coincida con lo que dice la landing.
  eventStartISO: '2026-10-05T14:00:00-05:00',
  eventEndISO: '2026-10-05T18:00:00-05:00',

  // Datos de la videollamada: se incluyen en la descripción del evento que se
  // agenda desde Google Calendar y desde el archivo .ics.
  meet: {
    url: 'https://meet.google.com/gkw-ygip-ayd',
    phone: '(CO) +57 601 8957114',
    pin: '890 695 130#',
    moreNumbersUrl: 'https://tel.meet/gkw-ygip-ayd?pin=5122081285806',
  },

  // Opciones de cargo (obligatorio). "value" es lo que se guarda en la base de
  // datos; si agregas una opción aquí, agrégala también en ALLOWED_CARGOS de
  // netlify/functions/submit-rsvp.js.
  cargoOptions: [
    { value: 'gerente', label: 'Gerente' },
    { value: 'asesor', label: 'Asesor' },
    { value: 'administrador', label: 'Administrador' },
  ],
};
