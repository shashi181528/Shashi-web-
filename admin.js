if (!window.GoodkindAdminAuth?.isSignedIn()) {
  window.location.replace('admin-login.html');
  throw new Error('Admin sign-in required.');
}

const config = window.GOODKIND_SUPABASE_CONFIG || {};
const featureLabels = { rewind: 'Rewind passed profiles', unlimitedLikes: 'Unlimited likes', advancedFilters: 'Advanced filters' };
let offers = [];
let profiles = [];
let subscriptions = [];
let editingPlanId = '';
let customPlanFeatures = [];
function slugify(value) { return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || `plan-${Date.now()}`; }
function planFromRow(row) {
  return { id: row.id, slug: row.slug, name: row.name, price: Number(row.price_minor_units) / 100, durationDays: row.duration_days, billingPeriod: row.billing_period, description: row.description, features: row.feature_keys || [], customFeatures: row.custom_features || [], published: row.published };
}
async function db(path, options = {}, retry = true) {
  const auth = window.GoodkindAdminAuth;
  let session = auth.getSession();
  if (!session?.access_token) throw new Error('Your admin sign-in expired. Please log in again.');
  if (Number(session.expires_at || 0) < Date.now() + 60000 && session.refresh_token) {
    const refreshed = await fetch(`${config.url.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    const body = await refreshed.json().catch(() => ({}));
    if (!refreshed.ok) { auth.signOut(); throw new Error('Your admin sign-in expired. Please log in again.'); }
    session = auth.saveSession(body);
  }
  const headers = { apikey: config.publishableKey, Authorization: `Bearer ${session.access_token}`, ...(options.headers || {}) };
  if (options.body !== undefined) { headers['Content-Type'] = 'application/json'; headers.Prefer = options.prefer || 'return=representation'; }
  const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/${path}`, { ...options, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (response.status === 401 && retry && session.refresh_token) {
    const refreshed = await fetch(`${config.url.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    const refreshedPayload = await refreshed.json().catch(() => ({}));
    if (!refreshed.ok) { auth.signOut(); throw new Error('Your admin sign-in expired. Please log in again.'); }
    auth.saveSession(refreshedPayload);
    return db(path, options, false);
  }
  if (!response.ok) throw new Error(payload.message || payload.details || payload.hint || `Database request failed (${response.status}).`);
  return payload;
}
function setFeedback(id, text, error = false) {
  const node = document.getElementById(id); node.textContent = text; node.style.color = error ? '#a3463d' : '';
}
function renderCustomFeatureDraft() {
  const list = document.getElementById('admin-custom-feature-list');
  list.replaceChildren();
  customPlanFeatures.forEach((feature, index) => {
    const chip = document.createElement('span'); chip.className = 'admin-custom-feature-chip';
    const name = document.createElement('span'); name.textContent = feature;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${feature}`);
    remove.addEventListener('click', () => { customPlanFeatures.splice(index, 1); renderCustomFeatureDraft(); });
    chip.append(name, remove); list.append(chip);
  });
}
function beginPlanEdit(plan) {
  editingPlanId = plan.id;
  document.getElementById('admin-plan-name').value = plan.name;
  document.getElementById('admin-plan-price').value = plan.price;
  document.getElementById('admin-plan-duration').value = plan.durationDays;
  document.getElementById('admin-plan-period').value = plan.billingPeriod;
  document.getElementById('admin-plan-description').value = plan.description || '';
  document.querySelectorAll('#admin-plan-form input[name="plan-feature"]').forEach((input) => { input.checked = plan.features.includes(input.value); });
  customPlanFeatures = [...plan.customFeatures]; renderCustomFeatureDraft();
  document.getElementById('admin-plan-submit').textContent = 'Save changes';
  document.getElementById('cancel-plan-edit').hidden = false;
  setFeedback('admin-plan-feedback', `Editing ${plan.name}.`);
  document.getElementById('admin-plan-name').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function resetPlanEditor() {
  editingPlanId = ''; customPlanFeatures = [];
  document.getElementById('admin-plan-form').reset();
  document.getElementById('admin-plan-duration').value = '30';
  document.querySelectorAll('#admin-plan-form input[name="plan-feature"]').forEach((input) => { input.checked = true; });
  document.getElementById('admin-plan-submit').innerHTML = 'Publish plan <span>→</span>';
  document.getElementById('cancel-plan-edit').hidden = true;
  renderCustomFeatureDraft();
}
function renderPortal() {
  const list = document.getElementById('admin-plan-list'); list.replaceChildren();
  if (!offers.length) { const empty = document.createElement('p'); empty.className = 'admin-empty'; empty.textContent = 'No offers yet. Publish a plan above to make it available.'; list.append(empty); }
  offers.forEach((plan) => {
    const row = document.createElement('div'); row.className = 'admin-plan-row';
    const info = document.createElement('div'); const title = document.createElement('strong'); title.textContent = `${plan.name} · ₹${plan.price} / ${plan.billingPeriod}`;
    const detail = document.createElement('span'); detail.textContent = `${plan.durationDays} days · ${[...plan.features.map((key) => featureLabels[key]).filter(Boolean), ...plan.customFeatures].join(' · ') || 'No premium features'} · ${plan.published ? 'Published' : 'Unpublished'}`;
    info.append(title, detail);
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'admin-secondary-button'; edit.textContent = 'Edit'; edit.addEventListener('click', () => beginPlanEdit(plan));
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'admin-secondary-button'; toggle.textContent = plan.published ? 'Unpublish' : 'Publish';
    toggle.addEventListener('click', async () => { toggle.disabled = true; try { await db(`plans?id=eq.${encodeURIComponent(plan.id)}`, { method: 'PATCH', body: { published: !plan.published } }); await loadPortal(); } catch (error) { setFeedback('admin-plan-feedback', error.message, true); toggle.disabled = false; } });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'admin-secondary-button danger'; remove.textContent = 'Remove';
    remove.addEventListener('click', async () => { remove.disabled = true; try { await db(`plans?id=eq.${encodeURIComponent(plan.id)}`, { method: 'DELETE' }); await loadPortal(); } catch (error) { setFeedback('admin-plan-feedback', error.message, true); remove.disabled = false; } });
    row.append(info, edit, toggle, remove); list.append(row);
  });
  const userSelect = document.getElementById('admin-user-select'); userSelect.replaceChildren();
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = profiles.length ? 'Choose a member' : 'No registered member profiles'; userSelect.append(placeholder);
  profiles.forEach((profile) => { const option = document.createElement('option'); option.value = profile.user_id; option.textContent = `${profile.display_name}${profile.city ? ` · ${profile.city}` : ''}`; userSelect.append(option); });
  const planSelect = document.getElementById('admin-grant-plan'); planSelect.replaceChildren();
  const published = offers.filter((plan) => plan.published); const noPlan = document.createElement('option'); noPlan.value = ''; noPlan.textContent = published.length ? 'Choose a published plan' : 'Publish an offer first'; planSelect.append(noPlan);
  published.forEach((plan) => { const option = document.createElement('option'); option.value = plan.id; option.textContent = `${plan.name} · ₹${plan.price}`; planSelect.append(option); });
  const subscriberList = document.getElementById('admin-subscriber-list'); subscriberList.replaceChildren();
  if (!subscriptions.length) { const empty = document.createElement('p'); empty.className = 'admin-empty'; empty.textContent = 'No active member subscriptions yet.'; subscriberList.append(empty); }
  subscriptions.forEach((sub) => {
    const profile = profiles.find((item) => item.user_id === sub.user_id);
    const row = document.createElement('div'); row.className = 'admin-plan-row'; const info = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = `${profile?.display_name || 'Member'} · ${sub.plans?.name || 'Membership'}`;
    const detail = document.createElement('span'); detail.textContent = `Active until ${new Date(sub.expires_at).toLocaleDateString()}`;
    info.append(title, detail); row.append(info); subscriberList.append(row);
  });
}
async function loadPortal() {
  setFeedback('admin-plan-feedback', 'Loading shared membership data…');
  const [planRows, profileRows, subscriptionRows] = await Promise.all([
    db('plans?select=*&order=display_order.asc,created_at.asc'),
    db('profiles?select=user_id,display_name,city&order=display_name.asc'),
    db(`subscriptions?select=user_id,plan_id,expires_at,plans(name)&status=eq.active&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&order=expires_at.desc`)
  ]);
  offers = (planRows || []).map(planFromRow); profiles = profileRows || []; subscriptions = subscriptionRows || [];
  renderPortal(); setFeedback('admin-plan-feedback', 'Shared membership data is up to date.');
}
document.getElementById('admin-plan-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.getElementById('admin-plan-submit'); button.disabled = true;
  const name = document.getElementById('admin-plan-name').value.trim();
  const current = offers.find((plan) => plan.id === editingPlanId);
  const row = {
    slug: current?.slug || slugify(name), name,
    price_minor_units: Math.round(Number(document.getElementById('admin-plan-price').value) * 100),
    duration_days: Number(document.getElementById('admin-plan-duration').value),
    billing_period: document.getElementById('admin-plan-period').value,
    description: document.getElementById('admin-plan-description').value.trim(),
    feature_keys: [...document.querySelectorAll('#admin-plan-form input[name="plan-feature"]:checked')].map((input) => input.value),
    custom_features: [...customPlanFeatures], published: current?.published ?? true
  };
  try {
    if (editingPlanId) await db(`plans?id=eq.${encodeURIComponent(editingPlanId)}`, { method: 'PATCH', body: row });
    else await db('plans', { method: 'POST', body: row });
    resetPlanEditor(); await loadPortal(); setFeedback('admin-plan-feedback', `${name} was saved to the shared plans database.`);
  } catch (error) { setFeedback('admin-plan-feedback', error.message, true); }
  finally { button.disabled = false; }
});
document.getElementById('cancel-plan-edit').addEventListener('click', () => { resetPlanEditor(); setFeedback('admin-plan-feedback', 'Edit cancelled.'); });
document.getElementById('add-custom-feature').addEventListener('click', () => {
  const input = document.getElementById('admin-custom-feature-input'); const feature = input.value.trim();
  if (!feature) { input.focus(); return; }
  if (customPlanFeatures.some((item) => item.toLowerCase() === feature.toLowerCase())) { setFeedback('admin-plan-feedback', 'That feature is already in this plan.', true); return; }
  customPlanFeatures.push(feature); input.value = ''; renderCustomFeatureDraft(); input.focus();
});
document.getElementById('admin-custom-feature-input').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); document.getElementById('add-custom-feature').click(); } });
document.getElementById('admin-grant-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]'); button.disabled = true;
  const userId = document.getElementById('admin-user-select').value; const plan = offers.find((item) => item.id === document.getElementById('admin-grant-plan').value && item.published);
  if (!userId || !plan) { setFeedback('admin-grant-feedback', 'Choose a member and a published plan.', true); button.disabled = false; return; }
  const starts = new Date(); const expires = new Date(starts.getTime() + Number(plan.durationDays) * 86400000);
  try {
    await db('subscriptions', { method: 'POST', body: { user_id: userId, plan_id: plan.id, status: 'active', starts_at: starts.toISOString(), expires_at: expires.toISOString() } });
    setFeedback('admin-grant-feedback', `${plan.name} access is active for this member.`); await loadPortal();
  } catch (error) { setFeedback('admin-grant-feedback', error.message, true); }
  finally { button.disabled = false; }
});
loadPortal().catch((error) => setFeedback('admin-plan-feedback', `${error.message} Confirm the schema is installed and this account has the admin role.`, true));
