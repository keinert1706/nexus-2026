(function () {
  const CONFIG = window.NEXUS_CONFIG;
  const $ = (id) => document.getElementById(id);

  const state = {
    confirmacion: null,
    menu: null,
    alergias: new Set(),
  };

  // ---------- Render meta info ----------
  $('metaDate').textContent = CONFIG.dateLabel;
  $('metaLocation').textContent = CONFIG.locationLabel;

  // ---------- Toggle Sí/No ----------
  const toggleButtons = document.querySelectorAll('#confirmacionToggle .toggle-btn');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value === 'true';
      state.confirmacion = value;
      toggleButtons.forEach((b) => b.classList.toggle('active', b === btn));
      $('menuSection').classList.toggle('hidden', !value);
      if (!value) {
        state.menu = null;
        state.alergias.clear();
      }
      setFieldError('confirmacion', '');
    });
  });

  // ---------- Menu cards ----------
  const menuGrid = $('menuGrid');
  CONFIG.menuOptions.forEach((option) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'menu-card';
    card.dataset.value = option.value;
    card.innerHTML = `<p class="menu-label">${option.label}</p><p class="menu-desc">${option.description || ''}</p>`;
    card.addEventListener('click', () => {
      state.menu = option.value;
      menuGrid.querySelectorAll('.menu-card').forEach((c) => c.classList.toggle('selected', c === card));
      setFieldError('menu', '');
    });
    menuGrid.appendChild(card);
  });

  // ---------- Allergy checkboxes ----------
  // "Ninguna" es excluyente: marcarla desmarca las demás, y marcar cualquier
  // otra desmarca "Ninguna" (igual que el diseño aprobado).
  const allergyGrid = $('allergyGrid');
  const allergyInputs = [];

  CONFIG.allergyOptions.forEach((option) => {
    const row = document.createElement('label');
    row.className = 'allergy-row';
    row.innerHTML = `<input type="checkbox" value="${option.value}"> <span>${option.label}</span>`;
    const input = row.querySelector('input');
    allergyInputs.push(input);

    input.addEventListener('change', () => {
      if (option.value === 'ninguna') {
        if (input.checked) {
          state.alergias.clear();
          state.alergias.add('ninguna');
          allergyInputs.forEach((i) => { if (i !== input) i.checked = false; });
        } else {
          state.alergias.delete('ninguna');
        }
      } else {
        const ninguna = allergyInputs.find((i) => i.value === 'ninguna');
        if (input.checked) {
          if (ninguna) ninguna.checked = false;
          state.alergias.delete('ninguna');
          state.alergias.add(option.value);
        } else {
          state.alergias.delete(option.value);
        }
      }
    });

    allergyGrid.appendChild(row);
  });

  // ---------- Validation helpers ----------
  function setFieldError(field, message) {
    const el = $(`err_${field}`);
    if (el) el.textContent = message;
    const input = $(field);
    if (input) input.classList.toggle('invalid', !!message);
  }

  function clearErrors() {
    ['nombre_completo', 'email', 'confirmacion', 'menu'].forEach((f) => setFieldError(f, ''));
    $('errorBanner').classList.add('hidden');
  }

  function showBanner(message) {
    const banner = $('errorBanner');
    banner.textContent = message;
    banner.classList.remove('hidden');
  }

  // ---------- Submit ----------
  const form = $('rsvpForm');
  const submitBtn = $('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const nombreCompleto = $('nombre_completo').value.trim();
    const email = $('email').value.trim();
    const telefono = $('telefono').value.trim();

    let hasError = false;
    if (!nombreCompleto) { setFieldError('nombre_completo', 'Este campo es obligatorio'); hasError = true; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('email', 'Ingresa un email válido'); hasError = true; }
    if (state.confirmacion === null) { setFieldError('confirmacion', 'Indica si asistirás'); hasError = true; }
    if (state.confirmacion === true && !state.menu) { setFieldError('menu', 'Elige una opción de menú'); hasError = true; }

    if (hasError) return;

    const payload = {
      nombre_completo: nombreCompleto,
      email,
      telefono: telefono || null,
      confirmacion: state.confirmacion,
      menu: state.confirmacion ? state.menu : null,
      alergias: state.confirmacion ? Array.from(state.alergias) : [],
      alergias_otro: state.confirmacion ? ($('alergias_otro').value.trim() || null) : null,
    };

    setLoading(true);

    try {
      const res = await fetch('/api/submit-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showConfirmation(payload);
        return;
      }

      if (res.status === 409) {
        showBanner(data.error || 'Este email ya está registrado.');
      } else if (res.status === 400 && data.fields) {
        Object.entries(data.fields).forEach(([field, message]) => setFieldError(field, message));
        showBanner(data.error || 'Revisa los campos marcados.');
      } else {
        showBanner(data.error || 'No pudimos guardar tu registro. Intenta de nuevo.');
      }
    } catch (err) {
      // Sin conexión o el servidor no respondió: no se pierde nada de lo escrito,
      // el usuario puede reintentar con el mismo formulario.
      showBanner('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo — tus datos no se han perdido.');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.innerHTML = isLoading ? '<span class="spinner"></span>Enviando…' : 'Confirmar asistencia';
  }

  // ---------- Confirmation screen + calendar ----------
  function showConfirmation(payload) {
    $('heroBlock').classList.add('hidden');
    form.classList.add('hidden');
    const card = $('confirmationCard');
    card.classList.remove('hidden');

    const firstName = (payload.nombre_completo || '').trim().split(' ')[0] || 'invitado';

    if (payload.confirmacion) {
      $('confirmationTitle').textContent = `¡Gracias, ${firstName}!`;
      $('confirmationMessage').textContent = `Tu asistencia a ${CONFIG.eventName} quedó confirmada. Te esperamos el ${CONFIG.dateLabel} en ${CONFIG.locationLabel}.`;
      $('googleCalBtn').href = buildGoogleCalendarUrl();
      $('icsBtn').addEventListener('click', downloadICS);
    } else {
      $('confirmationTitle').textContent = `Gracias, ${firstName}`;
      $('confirmationMessage').textContent = 'Gracias por avisarnos que no podrás acompañarnos esta vez.';
      $('calendarActions').classList.add('hidden');
    }
  }

  $('editBtn').addEventListener('click', () => {
    $('confirmationCard').classList.add('hidden');
    $('heroBlock').classList.remove('hidden');
    form.classList.remove('hidden');
  });

  function toICSDate(isoString) {
    return new Date(isoString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  function buildGoogleCalendarUrl() {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: CONFIG.eventName,
      dates: `${toICSDate(CONFIG.eventStartISO)}/${toICSDate(CONFIG.eventEndISO)}`,
      details: CONFIG.tagline,
      location: CONFIG.calendarLocation,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function downloadICS() {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexus 2026//RSVP//ES',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@nexus2026`,
      `DTSTAMP:${toICSDate(new Date().toISOString())}`,
      `DTSTART:${toICSDate(CONFIG.eventStartISO)}`,
      `DTEND:${toICSDate(CONFIG.eventEndISO)}`,
      `SUMMARY:${CONFIG.eventName}`,
      `DESCRIPTION:${CONFIG.tagline}`,
      `LOCATION:${CONFIG.calendarLocation}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-2026.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
})();
