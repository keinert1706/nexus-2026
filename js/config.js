// ============================================================================
// CONFIGURACIÓN DEL EVENTO — edita este archivo para cambiar fecha, lugar,
// tagline o las opciones de cargo. No necesitas tocar ningún otro archivo.
// Después de guardar, sube el cambio a GitHub y Netlify redesplegará solo.
// ============================================================================
window.NEXUS_CONFIG = {
  eventName: 'Nexus 2026',
  tagline: 'El encuentro del futuro y la excelencia',

  // Texto que se muestra en la landing (edítalo libremente).
  dateLabel: '5 de octubre · 2:00 PM',
  locationLabel: 'Maloka - Centro Interactivo, Cra 68D #24A-51, Ciudad Salitre, Bogotá',

  // Versión corta del lugar, usada en el link de Google Calendar y el .ics
  // (para que la URL/el evento de calendario no queden demasiado largos).
  calendarLocation: 'Maloka - Centro Interactivo, Cra 68D #24A-51, Bogotá',

  // Fecha/hora REAL de inicio en formato ISO 8601, usada por los botones de
  // calendario (Google Calendar y el archivo .ics). El "-05:00" es la zona
  // horaria de Bogotá. Si el evento es en otro país, ajusta el offset.
  // IMPORTANTE: si cambias dateLabel arriba, actualiza también esta línea
  // para que el botón de calendario coincida con lo que dice la landing.
  // No hay hora de fin: el evento se agenda solo con su hora de inicio.
  eventStartISO: '2026-10-05T14:00:00-05:00',

  // Opciones de cargo (obligatorio). "value" es lo que se guarda en la base de
  // datos; si agregas una opción aquí, agrégala también en ALLOWED_CARGOS de
  // netlify/functions/submit-rsvp.js.
  cargoOptions: [
    { value: 'gerente', label: 'Gerente' },
    { value: 'asesor', label: 'Asesor' },
    { value: 'administrador', label: 'Administrador' },
  ],
};
