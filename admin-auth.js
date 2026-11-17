/*
 * Demo-only browser gate. This is not real authentication: static GitHub Pages
 * cannot protect admin data or verify credentials on a server. Replace this
 * with server-side authentication before using the portal with real accounts.
 */
(function () {
  const sessionKey = 'goodkind-admin-authenticated';
  const username = 'admin';
  const passwordHash = '842ab248a8cf6a08a32f2ad0c91b5b7d16faa8dd5f9cd652124cfe36815fc356';

  async function hash(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  window.GoodkindAdminAuth = {
    isSignedIn() { return sessionStorage.getItem(sessionKey) === 'yes'; },
    async signIn(user, password) {
      const digest = await hash(password);
      if (user.trim().toLowerCase() !== username || digest !== passwordHash) return false;
      sessionStorage.setItem(sessionKey, 'yes');
      return true;
    },
    signOut() { sessionStorage.removeItem(sessionKey); }
  };
})();
