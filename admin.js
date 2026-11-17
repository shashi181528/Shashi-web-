if (!window.GoodkindAdminAuth?.isSignedIn()) {
  window.location.replace('admin-login.html');
  throw new Error('Admin sign-in required.');
}

const planOffersStorageKey = 'goodkind-demo-plan-offers';
const registeredPhonesStorageKey = 'goodkind-demo-registered-phones';
const profileStorageKey = 'goodkind-demo-profiles';
const accountSubscriptionsStorageKey = 'goodkind-demo-account-subscriptions';
const featureLabels = {
  rewind: 'Rewind passed profiles',
  unlimitedLikes: 'Unlimited likes',
  advancedFilters: 'Advanced filters'
};
const defaultOffers = [
  { id: 'goodkind-plus-monthly', name: 'Goodkind Plus', price: 199, billingPeriod: 'month', durationDays: 30, description: 'More freedom to find the people who feel like your people.', features: ['rewind', 'unlimitedLikes', 'advancedFilters'], published: true },
  { id: 'goodkind-plus-quarterly', name: 'Goodkind Plus · 3 months', price: 499, billingPeriod: 'quarter', durationDays: 90, description: 'Three months of thoughtful dating, with all Plus features.', features: ['rewind', 'unlimitedLikes', 'advancedFilters'], published: true }
];
let editingPlanId = '';
let customPlanFeatures = [];
function readStorage(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return saved == null ? fallback : saved;
  } catch { return fallback; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function readOffers() {
  const offers = readStorage(planOffersStorageKey, null);
  if (Array.isArray(offers)) return offers;
  writeStorage(planOffersStorageKey, defaultOffers);
  return defaultOffers;
}
function readRegisteredPhones() {
  const phones = readStorage(registeredPhonesStorageKey, []);
  return Array.isArray(phones) ? phones : [];
}
function readProfiles() {
  const profiles = readStorage(profileStorageKey, {});
  return profiles && typeof profiles === 'object' && !Array.isArray(profiles) ? profiles : {};
}
function readSubscriptions() {
  const subscriptions = readStorage(accountSubscriptionsStorageKey, {});
  return subscriptions && typeof subscriptions === 'object' && !Array.isArray(subscriptions) ? subscriptions : {};
}
function maskPhone(phone) { return `•••• ${String(phone).slice(-4)}`; }
function resetPlanEditor() {
  editingPlanId = '';
  customPlanFeatures = [];
  const form = document.getElementById('admin-plan-form');
  form.reset();
  document.getElementById('admin-plan-duration').value = '30';
  document.querySelectorAll('#admin-plan-form input[name="plan-feature"]').forEach((input) => { input.checked = true; });
  document.getElementById('admin-plan-submit').innerHTML = 'Publish plan <span>→</span>';
  document.getElementById('cancel-plan-edit').hidden = true;
  renderCustomFeatureDraft();
}
function beginPlanEdit(plan) {
  editingPlanId = plan.id;
  document.getElementById('admin-plan-name').value = plan.name || '';
  document.getElementById('admin-plan-price').value = String(plan.price ?? '');
  document.getElementById('admin-plan-duration').value = String(plan.durationDays || 30);
  document.getElementById('admin-plan-period').value = plan.billingPeriod || 'month';
  document.getElementById('admin-plan-description').value = plan.description || '';
  document.querySelectorAll('#admin-plan-form input[name="plan-feature"]').forEach((input) => { input.checked = (plan.features || []).includes(input.value); });
  customPlanFeatures = [...(plan.customFeatures || [])];
  renderCustomFeatureDraft();
  document.getElementById('admin-plan-submit').textContent = 'Save changes';
  document.getElementById('cancel-plan-edit').hidden = false;
  document.getElementById('admin-plan-feedback').textContent = `Editing ${plan.name}.`;
  document.getElementById('admin-plan-name').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderCustomFeatureDraft() {
  const featureList = document.getElementById('admin-custom-feature-list');
  if (!featureList) return;
  featureList.replaceChildren();
  customPlanFeatures.forEach((feature, index) => {
    const chip = document.createElement('span'); chip.className = 'admin-custom-feature-chip';
    const label = document.createElement('span'); label.textContent = feature;
    const remove = document.createElement('button'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${feature}`); remove.textContent = '×';
    remove.addEventListener('click', () => { customPlanFeatures.splice(index, 1); renderCustomFeatureDraft(); });
    chip.append(label, remove); featureList.append(chip);
  });
}
function renderAdminPortal() {
  const offers = readOffers();
  const offerList = document.getElementById('admin-plan-list');
  offerList.replaceChildren();
  if (!offers.length) {
    const empty = document.createElement('p'); empty.className = 'admin-empty'; empty.textContent = 'No offers yet. Publish a plan above to make it available.'; offerList.append(empty);
  }
  offers.forEach((plan) => {
    const row = document.createElement('div'); row.className = 'admin-plan-row';
    const info = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = `${plan.name} · ₹${plan.price} / ${plan.billingPeriod}`;
    const includedFeatures = [...(plan.features || []).map((feature) => featureLabels[feature]).filter(Boolean), ...(plan.customFeatures || [])];
    const detail = document.createElement('span'); detail.textContent = `${plan.durationDays} days · ${includedFeatures.join(' · ') || 'No premium features'}`;
    info.append(title, detail);
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'admin-secondary-button'; edit.textContent = 'Edit';
    edit.addEventListener('click', () => beginPlanEdit(plan));
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'admin-secondary-button'; toggle.textContent = plan.published ? 'Unpublish' : 'Publish';
    toggle.addEventListener('click', () => { writeStorage(planOffersStorageKey, readOffers().map((item) => item.id === plan.id ? { ...item, published: !item.published } : item)); renderAdminPortal(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'admin-secondary-button danger'; remove.textContent = 'Remove';
    remove.addEventListener('click', () => { writeStorage(planOffersStorageKey, readOffers().filter((item) => item.id !== plan.id)); renderAdminPortal(); });
    row.append(info, edit, toggle, remove); offerList.append(row);
  });

  const profiles = readProfiles();
  const registered = readRegisteredPhones();
  const userSelect = document.getElementById('admin-user-select'); userSelect.replaceChildren();
  const userPlaceholder = document.createElement('option'); userPlaceholder.value = ''; userPlaceholder.textContent = registered.length ? 'Choose an account' : 'No registered accounts in this browser'; userSelect.append(userPlaceholder);
  registered.forEach((phone) => {
    const option = document.createElement('option'); option.value = phone;
    option.textContent = `${maskPhone(phone)}${profiles[phone]?.name ? ` · ${profiles[phone].name}` : ''}`; userSelect.append(option);
  });
  const planSelect = document.getElementById('admin-grant-plan'); planSelect.replaceChildren();
  const published = offers.filter((plan) => plan.published);
  const planPlaceholder = document.createElement('option'); planPlaceholder.value = ''; planPlaceholder.textContent = published.length ? 'Choose a published plan' : 'Publish an offer first'; planSelect.append(planPlaceholder);
  published.forEach((plan) => { const option = document.createElement('option'); option.value = plan.id; option.textContent = `${plan.name} · ₹${plan.price}`; planSelect.append(option); });

  const subscriberList = document.getElementById('admin-subscriber-list'); subscriberList.replaceChildren();
  const active = Object.entries(readSubscriptions()).filter(([, sub]) => Number.isFinite(new Date(sub.expiresAt).getTime()) && new Date(sub.expiresAt).getTime() > Date.now());
  if (!active.length) {
    const empty = document.createElement('p'); empty.className = 'admin-empty'; empty.textContent = 'No active preview subscriptions yet.'; subscriberList.append(empty);
  }
  active.forEach(([phone, sub]) => {
    const row = document.createElement('div'); row.className = 'admin-plan-row';
    const info = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = `${maskPhone(phone)} · ${sub.planName}`;
    const detail = document.createElement('span'); detail.textContent = `Active until ${new Date(sub.expiresAt).toLocaleDateString()}`;
    info.append(title, detail); row.append(info); subscriberList.append(row);
  });
}
document.getElementById('admin-plan-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('admin-plan-name').value.trim();
  const price = Number(document.getElementById('admin-plan-price').value);
  const durationDays = Number(document.getElementById('admin-plan-duration').value);
  if (!name || price < 1 || durationDays < 1) return;
  const plan = {
    id: editingPlanId || `custom-${Date.now()}`,
    name,
    price,
    durationDays,
    billingPeriod: document.getElementById('admin-plan-period').value,
    description: document.getElementById('admin-plan-description').value.trim(),
    features: [...document.querySelectorAll('#admin-plan-form input[name="plan-feature"]:checked')].map((input) => input.value),
    customFeatures: [...customPlanFeatures],
    published: editingPlanId ? readOffers().find((offer) => offer.id === editingPlanId)?.published ?? true : true
  };
  const updatedOffers = editingPlanId
    ? readOffers().map((offer) => offer.id === editingPlanId ? plan : offer)
    : [...readOffers(), plan];
  if (!writeStorage(planOffersStorageKey, updatedOffers)) {
    document.getElementById('admin-plan-feedback').textContent = 'Could not save this offer in browser storage.';
    return;
  }
  document.getElementById('admin-plan-feedback').textContent = editingPlanId ? `${name} was updated.` : `${name} is published on the Plans page.`;
  resetPlanEditor();
  renderAdminPortal();
});
document.getElementById('cancel-plan-edit').addEventListener('click', () => {
  resetPlanEditor();
  document.getElementById('admin-plan-feedback').textContent = 'Edit cancelled.';
});
document.getElementById('add-custom-feature').addEventListener('click', () => {
  const input = document.getElementById('admin-custom-feature-input');
  const feature = input.value.trim();
  if (!feature) { input.focus(); return; }
  if (customPlanFeatures.some((item) => item.toLowerCase() === feature.toLowerCase())) {
    document.getElementById('admin-plan-feedback').textContent = 'That feature is already in this plan.';
    input.focus();
    return;
  }
  customPlanFeatures.push(feature);
  input.value = '';
  renderCustomFeatureDraft();
  input.focus();
});
document.getElementById('admin-custom-feature-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); document.getElementById('add-custom-feature').click(); }
});
document.getElementById('admin-grant-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const phone = document.getElementById('admin-user-select').value;
  const plan = readOffers().find((item) => item.id === document.getElementById('admin-grant-plan').value && item.published);
  const feedback = document.getElementById('admin-grant-feedback');
  if (!phone || !plan) { feedback.textContent = 'Choose a registered account and a published plan.'; return; }
  const subscriptions = readSubscriptions();
  const startsAt = Date.now();
  subscriptions[phone] = {
    planId: plan.id,
    planName: plan.name,
    features: [...(plan.features || [])],
    startsAt: new Date(startsAt).toISOString(),
    expiresAt: new Date(startsAt + Number(plan.durationDays) * 86400000).toISOString()
  };
  if (!writeStorage(accountSubscriptionsStorageKey, subscriptions)) { feedback.textContent = 'Could not save account access in browser storage.'; return; }
  feedback.textContent = `${plan.name} preview access granted to ${maskPhone(phone)}.`;
  renderAdminPortal();
});
window.addEventListener('storage', renderAdminPortal);
renderAdminPortal();
