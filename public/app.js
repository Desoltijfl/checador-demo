(async () => {
  const apiBase = '/api';
  const $ = (id) => document.getElementById(id);

  function setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }
  function getToken() { return localStorage.getItem('token'); }

  async function api(path, opts = {}) {
    const headers = opts.headers || {};
    headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(apiBase + path, { ...opts, headers });
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }; }
    catch (e) { return { ok: res.ok, status: res.status, data: text }; }
  }

  // UI elements
  const btnRegister = $('btn-register');
  const btnLogin = $('btn-login');
  const btnLogout = $('btn-logout');
  const btnIn = $('btn-in');
  const btnOut = $('btn-out');
  const regName = $('reg-name');
  const regEmail = $('reg-email');
  const regPassword = $('reg-password');
  const loginEmail = $('login-email');
  const loginPassword = $('login-password');
  const userInfo = $('user-info');
  const appDiv = $('app');
  const authDiv = $('auth');
  const historyDiv = $('history');
  const lastAction = $('last-action');

  function showLoggedIn(user) {
    authDiv.style.display = 'none';
    appDiv.style.display = 'block';
    userInfo.textContent = `${user.name || user.email} (${user.email})`;
  }
  function showLoggedOut() {
    authDiv.style.display = 'block';
    appDiv.style.display = 'none';
    userInfo.textContent = '';
    historyDiv.innerHTML = '';
    lastAction.textContent = '';
  }

  // Register
  btnRegister.addEventListener('click', async () => {
    const name = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;
    if (!email || !password) return alert('email y password requeridos');
    const res = await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
    if (res.ok) {
      alert('Registrado. Ahora haz login.');
      regName.value = regEmail.value = regPassword.value = '';
    } else {
      alert('Error: ' + (res.data?.error || JSON.stringify(res.data)));
    }
  });

  // Login
  btnLogin.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) return alert('email y password requeridos');
    const res = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.ok) {
      setToken(res.data.token);
      showLoggedIn(res.data.user);
      loginEmail.value = loginPassword.value = '';
      await loadHistory();
    } else {
      alert('Error login: ' + (res.data?.error || JSON.stringify(res.data)));
    }
  });

  btnLogout.addEventListener('click', () => {
    setToken(null);
    showLoggedOut();
  });

  // Checkin actions
  async function doCheck(type) {
    const res = await api('/checkin', { method: 'POST', body: JSON.stringify({ type }) });
    if (res.ok) {
      lastAction.textContent = `Registrado ${type} a las ${new Date(res.data.timestamp).toLocaleString()}`;
      await loadHistory();
    } else {
      alert('Error checkin: ' + (res.data?.error || JSON.stringify(res.data)));
    }
  }
  btnIn.addEventListener('click', () => doCheck('IN'));
  btnOut.addEventListener('click', () => doCheck('OUT'));

  // Load history
  async function loadHistory() {
    const res = await api('/checks');
    if (res.ok) {
      const arr = res.data || [];
      if (arr.length === 0) historyDiv.innerHTML = '<div>No hay registros aún.</div>';
      else {
        const rows = arr.map(c => `<tr><td>${new Date(c.timestamp).toLocaleString()}</td><td>${c.type}</td><td>${c.device || ''}</td></tr>`).join('');
        historyDiv.innerHTML = `<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Dispositivo</th></tr></thead><tbody>${rows}</tbody></table>`;
      }
    } else {
      historyDiv.innerHTML = '<div>Error cargando historial</div>';
    }
  }

  // On load: if token exists, try to fetch user info by login endpoint? we stored user in token only
  // For simplicity, try to load history; if unauthorized, clear token.
  if (getToken()) {
    const res = await api('/checks');
    if (res.status === 401) {
      setToken(null);
      showLoggedOut();
    } else {
      // we don't have user object: call login info is returned on login only
      // so show basic UI and load history
      showLoggedIn({ email: '(usuario)', name: '' });
      await loadHistory();
    }
  } else {
    showLoggedOut();
  }
})();