(function () {
  const $ = (id) => document.getElementById(id);
  const PAGE_SIZE = 25;
  let currentPage = 1;
  let totalPages = 1;

  const ALLERGY_LABELS = {
    gluten: 'Gluten',
    lacteos: 'Lácteos',
    frutos_secos: 'Frutos secos',
    vegetariano: 'Vegetariano',
    vegano: 'Vegano',
    ninguna: 'Ninguna',
  };

  function getToken() { return sessionStorage.getItem('nexus_dashboard_token'); }
  function setToken(token) { sessionStorage.setItem('nexus_dashboard_token', token); }
  function clearToken() { sessionStorage.removeItem('nexus_dashboard_token'); }

  function showLogin(message) {
    clearToken();
    $('dashboardScreen').classList.add('hidden');
    $('loginScreen').classList.remove('hidden');
    if (message) {
      $('loginError').textContent = message;
      $('loginError').classList.remove('hidden');
    }
  }

  function showDashboard() {
    $('loginScreen').classList.add('hidden');
    $('dashboardScreen').classList.remove('hidden');
    loadStats();
    loadList(1);
  }

  async function apiGet(action, params) {
    const token = getToken();
    if (!token) { showLogin(); return null; }

    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`/api/dashboard-data?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      showLogin('Tu sesión expiró. Ingresa la contraseña de nuevo.');
      return null;
    }

    if (!res.ok) throw new Error('request_failed');
    return res.json();
  }

  // ---------- Login ----------
  $('loginBtn').addEventListener('click', async () => {
    const password = $('passwordInput').value;
    $('loginError').classList.add('hidden');

    try {
      const res = await fetch('/api/dashboard-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        $('loginError').textContent = data.error || 'No pudimos iniciar sesión.';
        $('loginError').classList.remove('hidden');
        return;
      }

      setToken(data.token);
      showDashboard();
    } catch {
      $('loginError').textContent = 'No pudimos conectar con el servidor. Intenta de nuevo.';
      $('loginError').classList.remove('hidden');
    }
  });

  $('passwordInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('loginBtn').click();
  });

  $('logoutBtn').addEventListener('click', () => showLogin());

  // ---------- Stats ----------
  async function loadStats() {
    try {
      const stats = await apiGet('stats', {});
      if (!stats) return;

      $('statTotal').textContent = stats.total_registros ?? 0;
      $('statConfirmados').textContent = stats.total_confirmados ?? 0;
      $('statNoAsisten').textContent = stats.total_no_asisten ?? 0;
      const pct = stats.total_registros ? Math.round((stats.total_confirmados / stats.total_registros) * 100) : 0;
      $('statPendientes').textContent = `${pct}%`;

      $('menuBreakdown').innerHTML = renderBreakdown(stats.menu_counts);
      $('allergyBreakdown').innerHTML = renderBreakdown(stats.alergia_counts, ALLERGY_LABELS);
    } catch {
      // los stat tiles simplemente quedan en "–"; el listado abajo mostrará el error si persiste
    }
  }

  function renderBreakdown(counts, labelMap) {
    const entries = Object.entries(counts || {});
    if (!entries.length) return '<div class="breakdown-row"><span>Sin datos</span></div>';
    return entries
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => `<div class="breakdown-row"><span>${(labelMap && labelMap[key]) || key}</span><span>${count}</span></div>`)
      .join('');
  }

  // ---------- Attendee list ----------
  async function loadList(page) {
    $('listError').classList.add('hidden');
    try {
      const data = await apiGet('list', { page, pageSize: PAGE_SIZE });
      if (!data) return;

      currentPage = data.page;
      totalPages = data.totalPages;

      const list = $('attendeeList');
      list.innerHTML = '';
      $('emptyState').classList.toggle('hidden', data.rows.length > 0);

      data.rows.forEach((row) => list.appendChild(renderAttendeeRow(row)));

      $('pageInfo').textContent = `Página ${currentPage} de ${totalPages} · ${data.total} registros`;
      $('prevBtn').disabled = currentPage <= 1;
      $('nextBtn').disabled = currentPage >= totalPages;
    } catch {
      $('listError').textContent = 'No pudimos cargar el listado. Intenta recargar la página.';
      $('listError').classList.remove('hidden');
    }
  }

  function renderAttendeeRow(row) {
    const el = document.createElement('div');
    el.className = 'attendee-row';
    const badge = row.confirmacion
      ? '<span class="badge badge-yes">Asiste</span>'
      : '<span class="badge badge-no">No asiste</span>';

    const metaParts = [];
    if (row.telefono) metaParts.push(`Tel: ${row.telefono}`);
    if (row.confirmacion && row.menu) metaParts.push(`Menú: ${row.menu}`);
    if (row.confirmacion && row.alergias?.length) {
      metaParts.push(`Alergias: ${row.alergias.map((a) => ALLERGY_LABELS[a] || a).join(', ')}`);
    }
    if (row.alergias_otro) metaParts.push(`Otra: ${row.alergias_otro}`);
    metaParts.push(new Date(row.created_at).toLocaleString('es'));

    el.innerHTML = `
      <div class="row-top">
        <span class="name">${escapeHtml(row.nombre_completo)}</span>
        ${badge}
      </div>
      <div class="email">${escapeHtml(row.email)}</div>
      <div class="attendee-meta">${metaParts.map(escapeHtml).join(' · ')}</div>
    `;
    return el;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  $('prevBtn').addEventListener('click', () => { if (currentPage > 1) loadList(currentPage - 1); });
  $('nextBtn').addEventListener('click', () => { if (currentPage < totalPages) loadList(currentPage + 1); });

  // ---------- Export CSV ----------
  $('exportBtn').addEventListener('click', async () => {
    const btn = $('exportBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Generando CSV…';
    btn.disabled = true;

    try {
      const data = await apiGet('export', {});
      if (!data) return;

      const headers = ['nombre_completo', 'email', 'telefono', 'confirmacion', 'menu', 'alergias', 'alergias_otro', 'created_at'];
      const csvRows = [headers.join(',')];

      data.rows.forEach((row) => {
        const values = headers.map((h) => {
          let v = row[h];
          if (Array.isArray(v)) v = v.join('; ');
          if (v === null || v === undefined) v = '';
          v = String(v).replace(/"/g, '""');
          return `"${v}"`;
        });
        csvRows.push(values.join(','));
      });

      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-2026-asistentes-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('No pudimos generar el CSV. Intenta de nuevo.');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  // ---------- Boot ----------
  if (getToken()) showDashboard();
})();
