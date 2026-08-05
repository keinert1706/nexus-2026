// ============================================================================
// CONFIGURACIÓN DEL EVENTO — edita este archivo para cambiar fecha, lugar,
// tagline o las opciones de menú. No necesitas tocar ningún otro archivo.
// Después de guardar, sube el cambio a GitHub y Netlify redesplegará solo.
// ============================================================================
window.NEXUS_CONFIG = {
  eventName: 'Nexus 2026',
  tagline: 'El encuentro del futuro y la excelencia',

  // Texto que se muestra en la landing (edítalo libremente).
  dateLabel: '5 de septiembre · 10:00 AM - 04:00 PM',
  locationLabel: 'Maloka - Centro Interactivo, Cra 68D #24A-51, Ciudad Salitre, Bogotá',

  // Versión corta del lugar, usada en el link de Google Calendar y el .ics
  // (para que la URL/el evento de calendario no queden demasiado largos).
  calendarLocation: 'Maloka - Centro Interactivo, Cra 68D #24A-51, Bogotá',

  // Fecha/hora REAL en formato ISO 8601, usadas por los botones de calendario
  // (Google Calendar y el archivo .ics). El "-05:00" es la zona horaria de
  // Bogotá. Si el evento es en otro país, ajusta el offset.
  // IMPORTANTE: si cambias dateLabel arriba, actualiza también estas dos líneas
  // para que el botón de calendario coincida con lo que dice la landing.
  eventStartISO: '2026-09-05T10:00:00-05:00',
  eventEndISO: '2026-09-05T16:00:00-05:00',

  // Opciones de menú. "value" es lo que se guarda en la base de datos,
  // "label" y "description" son lo que ve el asistente. Puedes cambiar los
  // textos libremente; evita cambiar "value" si ya hay gente registrada.
  // (Por ahora hay 2 platos definidos en el diseño aprobado — agrega un
  // tercer objeto aquí si necesitas una tercera opción.)
  menuOptions: [
    { value: 'posta', label: 'Posta negra cartagenera', description: 'Arroz con coco, canasta de plátano con guacamole y jugo natural.' },
    { value: 'mixto', label: 'Mixto mar y tierra', description: 'Rib-eye, camarones, ensalada parrillísima, pasta fetuccini en salsa blanca o arroz.' },
  ],

  // Opciones fijas de alergias/restricciones (checkboxes). Además siempre hay
  // un campo de texto libre para "otra". Seleccionar "Ninguna" desmarca las
  // demás, y seleccionar cualquier otra desmarca "Ninguna".
  allergyOptions: [
    { value: 'gluten', label: 'Gluten' },
    { value: 'lacteos', label: 'Lácteos' },
    { value: 'frutos_secos', label: 'Frutos secos' },
    { value: 'vegetariano', label: 'Vegetariano' },
    { value: 'vegano', label: 'Vegano' },
    { value: 'ninguna', label: 'Ninguna' },
  ],
};
