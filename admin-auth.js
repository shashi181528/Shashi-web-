(function () {
  const config = window.GOODKIND_SUPABASE_CONFIG || {};
  const sessionKey = 'together-admin-supabase-session';
  function getSession() {
    try { return JSON.parse(localStorage.getItem(sessionKey) || 'null'); } catch { return null; }
  }
  function saveSession(session) {
    const normalized = { ...session, expires_at: Date.now() + Number(session.expires_in || 3600) * 1000 };
    localStorage.setItem(sessionKey, JSON.stringify(normalized));
    return normalized;
  }
  async function signIn(email, password) {
    if (!config.url || !config.publishableKey) throw new Error('Supabase is not configured.');
    const response = await fetch(`${config.url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.msg || payload.message || 'Email or password is incorrect.');
    const session = saveSession(payload);
    const roleResponse = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/user_roles?select=role&user_id=eq.${encodeURIComponent(payload.user.id)}`, {
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${session.access_token}` }
    });
    const roles = await roleResponse.json().catch(() => []);
    if (!roleResponse.ok || !roles.some((item) => item.role === 'admin')) {
      localStorage.removeItem(sessionKey);
      throw new Error('This account does not have the admin role. Add it in Supabase before signing in.');
    }
    return true;
  }
  window.GoodkindAdminAuth = {
    sessionKey,
    isSignedIn() { return Boolean(getSession()?.access_token); },
    getSession,
    saveSession,
    signIn,
    signOut() { localStorage.removeItem(sessionKey); }
  };
})();
