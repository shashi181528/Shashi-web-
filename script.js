const genderCopy = {
  Woman: 'Woman. Your way. No footnotes needed.',
  Man: 'Man. Your way. No footnotes needed.',
  'Non-binary': 'Non-binary. Your way. No footnotes needed.'
};
document.querySelectorAll('.gender-option').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.gender-option').forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    document.getElementById('gender-message').textContent = genderCopy[button.dataset.gender];
  });
});
const menuButton = document.querySelector('.menu-toggle');
const siteHeader = document.querySelector('.site-header');
const mobileDrawer = document.getElementById('mobile-drawer');
const menuBackdrop = document.querySelector('.menu-backdrop');
function setMobileMenu(open) {
  siteHeader.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  const isMobile = window.matchMedia('(max-width: 620px)').matches;
  mobileDrawer.setAttribute('aria-hidden', String(isMobile && !open));
}
window.addEventListener('resize', () => {
  const isMobile = window.matchMedia('(max-width: 620px)').matches;
  mobileDrawer.setAttribute('aria-hidden', String(isMobile && !siteHeader.classList.contains('menu-open')));
});
menuButton.addEventListener('click', () => {
  setMobileMenu(!siteHeader.classList.contains('menu-open'));
});
menuBackdrop.addEventListener('click', () => setMobileMenu(false));
setMobileMenu(false);
const overlay = document.getElementById('auth-overlay');
const landingMain = document.getElementById('top');
const matchesPage = document.getElementById('matches-page');
const likesPage = document.getElementById('likes-page');
const findMatchesNav = document.getElementById('find-matches-nav');
const likesNav = document.getElementById('likes-nav');
const panels = [...document.querySelectorAll('.auth-panel')];
const progress = [...document.querySelectorAll('.progress-step')];
const profile = { location: null, photoUrls: [] };
const registryStorageKey = 'goodkind-demo-registered-phones';
const sessionStorageKey = 'goodkind-demo-active-phone';
const registeredPhones = new Set(readRegisteredPhones());
let authMode = 'register';
let verifiedPhone = '';
let currentPhoneKey = readActivePhone();
let currentMatchIndex = 0;
let visibleMatches = [];
const logoutButton = document.getElementById('logout-button');
const loginButtons = [...document.querySelectorAll('.nav-actions .auth-trigger')];
function syncAccountNavigation() {
  const signedIn = Boolean(currentPhoneKey && registeredPhones.has(currentPhoneKey));
  findMatchesNav.classList.toggle('hidden', !signedIn);
  likesNav.classList.toggle('hidden', !signedIn);
  logoutButton.classList.toggle('hidden', !signedIn);
  loginButtons.forEach((button) => button.classList.toggle('hidden', signedIn));
}
function readRegisteredPhones() {
  try {
    const saved = JSON.parse(localStorage.getItem(registryStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
function readActivePhone() {
  try {
    const phone = localStorage.getItem(sessionStorageKey) || '';
    return registeredPhones.has(phone) ? phone : '';
  } catch {
    return '';
  }
}
function setActiveSession(phone) {
  currentPhoneKey = phone;
  try {
    localStorage.setItem(sessionStorageKey, phone);
  } catch {
    // Keep the session in memory if browser storage is unavailable.
  }
  syncAccountNavigation();
}
function saveRegisteredPhone(phone) {
  registeredPhones.add(phone);
  try {
    localStorage.setItem(registryStorageKey, JSON.stringify([...registeredPhones]));
  } catch {
    // Keep the registration in memory for this browser session if storage is unavailable.
  }
}
syncAccountNavigation();
function normalizePhone(countryCode, phone) {
  return `${countryCode}${phone.replace(/\D/g, '')}`;
}
function calculateAge(value) {
  if (!value) return NaN;
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return NaN;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday = today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
const dobInput = document.getElementById('profile-dob');
const ageInput = document.getElementById('profile-age');
const today = new Date();
const dobMax = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
const dobMin = new Date(today.getFullYear() - 99, today.getMonth(), today.getDate());
const toDateInputValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
dobInput.max = toDateInputValue(dobMax);
dobInput.min = toDateInputValue(dobMin);
dobInput.addEventListener('change', () => {
  const age = calculateAge(dobInput.value);
  if (Number.isFinite(age) && age >= 0 && age <= 99) ageInput.value = String(age).padStart(2, '0');
});
ageInput.addEventListener('input', () => { ageInput.value = ageInput.value.replace(/\D/g, '').slice(0, 2); });
const bioInput = document.getElementById('profile-bio');
bioInput.addEventListener('input', () => { document.getElementById('bio-count').textContent = String(bioInput.value.length); });
function showPanel(id, step) {
  panels.forEach((panel) => panel.classList.toggle('hidden', panel.id !== id));
  progress.forEach((bar, index) => {
    bar.classList.toggle('current', index === step);
    bar.classList.toggle('done', index < step);
  });
  const dialog = document.querySelector('.auth-dialog');
  dialog.scrollTop = 0;
  const focusTarget = document.querySelector(`#${id} input:not([type="file"]), #${id} button`);
  if (focusTarget) setTimeout(() => focusTarget.focus(), 50);
}
function openAuth(mode = 'register') {
  authMode = mode;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('auth-open');
  document.querySelector('#phone-form h2').innerHTML = mode === 'login' ? 'Good to see<br><em>you again.</em>' : 'Your number,<br><em>your next chapter.</em>';
  document.querySelector('#phone-form .auth-description').textContent = mode === 'login'
    ? 'Sign in with your mobile number. We’ll send a one-time code to verify it.'
    : 'Sign in or create an account with your mobile number. We’ll send a one-time code to verify it.';
  document.querySelectorAll('.auth-error').forEach((error) => { error.textContent = ''; });
  document.getElementById('auth-alert').hidden = true;
  showPanel('phone-form', 0);
}
function closeAuth() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('auth-open');
}
function showLandingPage() {
  matchesPage.hidden = true;
  likesPage.hidden = true;
  landingMain.hidden = false;
  document.body.classList.remove('matches-view');
}
function openMatchesPage() {
  closeAuth();
  landingMain.hidden = true;
  likesPage.hidden = true;
  matchesPage.hidden = false;
  document.body.classList.add('matches-view');
  if (!matchFiltersInitialized) initializeMatchFilters();
  applyMatchFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openLikesPage() {
  closeAuth();
  landingMain.hidden = true;
  matchesPage.hidden = true;
  likesPage.hidden = false;
  document.body.classList.add('matches-view');
  renderLikesPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.main-nav a, .site-footer a, .site-header .brand').forEach((link) => link.addEventListener('click', () => {
  if (!matchesPage.hidden) showLandingPage();
  setMobileMenu(false);
}));
findMatchesNav.addEventListener('click', () => {
  setMobileMenu(false);
  if (currentPhoneKey && registeredPhones.has(currentPhoneKey)) openMatchesPage();
  else openAuth('login');
});
likesNav.addEventListener('click', () => {
  setMobileMenu(false);
  if (currentPhoneKey && registeredPhones.has(currentPhoneKey)) openLikesPage();
  else openAuth('login');
});
logoutButton.addEventListener('click', () => {
  try {
    localStorage.removeItem(sessionStorageKey);
  } catch {
    // Clear the in-memory session even if browser storage is unavailable.
  }
  currentPhoneKey = '';
  closeAuth();
  showLandingPage();
  syncAccountNavigation();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.getElementById('footer-match-trigger').addEventListener('click', () => findMatchesNav.click());
document.querySelectorAll('.auth-trigger').forEach((button) => button.addEventListener('click', () => {
  setMobileMenu(false);
  openAuth(button.dataset.authMode || 'register');
}));
document.querySelector('.auth-close').addEventListener('click', closeAuth);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (overlay.classList.contains('open')) closeAuth();
  if (siteHeader.classList.contains('menu-open')) setMobileMenu(false);
});
document.querySelector('.back-to-phone').addEventListener('click', () => showPanel('phone-form', 0));
document.querySelectorAll('.back-to-profile').forEach((button) => button.addEventListener('click', () => showPanel('profile-form', 2)));
document.querySelector('.back-to-details').addEventListener('click', () => showPanel('details-form', 3));
document.getElementById('phone-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const callingCode = document.getElementById('country-code').value;
  const enteredNumber = document.getElementById('phone-number').value.trim();
  currentPhoneKey = normalizePhone(callingCode, enteredNumber);
  verifiedPhone = `${callingCode} ${enteredNumber}`;
  const alertBox = document.getElementById('auth-alert');
  const alertMessage = document.getElementById('auth-alert-message');
  const alertAction = document.getElementById('auth-alert-action');
  if (authMode === 'login' && !registeredPhones.has(currentPhoneKey)) {
    alertMessage.textContent = 'This number is not registered yet. Create an account first, then come back to log in.';
    alertAction.textContent = 'Register for an account';
    alertAction.onclick = () => openAuth('register');
    alertBox.hidden = false;
    return;
  }
  if (authMode === 'register' && registeredPhones.has(currentPhoneKey)) {
    alertMessage.textContent = 'This number already has an account. Log in with this number instead.';
    alertAction.textContent = 'Go to log in';
    alertAction.onclick = () => openAuth('login');
    alertBox.hidden = false;
    return;
  }
  alertBox.hidden = true;
  document.getElementById('phone-display').textContent = verifiedPhone;
  showPanel('otp-form', 1);
});
document.getElementById('otp-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const code = document.getElementById('otp-code').value.trim();
  if (!/^\d{6}$/.test(code)) {
    form.querySelector('.auth-error').textContent = 'Enter the 6-digit code to continue.';
    return;
  }
  if (authMode === 'login') {
    setActiveSession(currentPhoneKey);
    showMatches();
  } else {
    showPanel('profile-form', 2);
  }
});
const locationSearch = document.getElementById('location-search');
const locationSuggestions = document.getElementById('location-suggestions');
const locationStatus = document.getElementById('location-status');
const useTypedLocation = document.getElementById('manual-location-use');
const MAPTILER_API_KEY = 'beeea696c45347548d0f25ca20297a91';
let locationSearchTimer;
let locationSearchController;
let locationOptions = [];
let activeLocationOption = -1;
function hideLocationSuggestions() {
  locationSuggestions.hidden = true;
  locationSearch.setAttribute('aria-expanded', 'false');
  locationSearch.removeAttribute('aria-activedescendant');
  activeLocationOption = -1;
}
function formatPlace(feature) {
  if (feature.place_name || feature.matching_place_name) return feature.place_name || feature.matching_place_name;
  const properties = feature.properties || {};
  const local = feature.text || properties.name || properties.street || properties.city || properties.district || 'Place';
  const context = (feature.context || []).map((item) => item.text).filter(Boolean);
  return [...new Set([local, ...context])].join(', ');
}
function renderLocationOptions(features) {
  locationOptions = features.filter((feature) => feature?.geometry?.coordinates?.length === 2 && (feature?.place_name || feature?.text || feature?.properties));
  locationSuggestions.replaceChildren();
  if (!locationOptions.length) {
    const empty = document.createElement('div');
    empty.className = 'location-empty';
    empty.textContent = 'No places found. Try adding a city or state.';
    locationSuggestions.append(empty);
    locationSuggestions.hidden = false;
    locationSearch.setAttribute('aria-expanded', 'true');
    return;
  }
  locationOptions.forEach((feature, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'location-option';
    option.id = `location-option-${index}`;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.textContent = formatPlace(feature);
    option.addEventListener('click', () => selectLocation(feature));
    locationSuggestions.append(option);
  });
  locationSuggestions.hidden = false;
  locationSearch.setAttribute('aria-expanded', 'true');
}
function selectLocation(feature) {
  const [longitude, latitude] = feature.geometry.coordinates;
  profile.location = { latitude, longitude, label: formatPlace(feature), source: 'manual' };
  locationSearch.value = profile.location.label;
  useTypedLocation.hidden = true;
  locationStatus.textContent = `Location selected: ${profile.location.label}`;
  locationStatus.classList.add('ok');
  hideLocationSuggestions();
}
locationSearch.addEventListener('input', () => {
  const query = locationSearch.value.trim();
  useTypedLocation.hidden = query.length < 3;
  useTypedLocation.textContent = query.length >= 3 ? `Use “${query}”` : 'Use this area';
  clearTimeout(locationSearchTimer);
  if (locationSearchController) locationSearchController.abort();
  if (profile.location?.source === 'manual' && query !== profile.location.label) {
    profile.location = null;
    locationStatus.textContent = 'Choose a suggested place to set your location.';
    locationStatus.classList.remove('ok');
  }
  if (query.length < 3) {
    hideLocationSuggestions();
    return;
  }
  locationStatus.textContent = 'Searching nearby areas…';
  locationStatus.classList.remove('ok');
  locationSearchTimer = setTimeout(async () => {
    locationSearchController = new AbortController();
    try {
      const params = new URLSearchParams({ key: MAPTILER_API_KEY, limit: '6', language: 'en', autocomplete: 'true' });
      const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params}`, { signal: locationSearchController.signal });
      if (!response.ok) throw new Error(response.status === 403
        ? location.protocol === 'file:'
          ? 'MapTiler rejected the local file preview. Open this site from http://localhost and allow localhost in the key’s domain settings.'
          : 'MapTiler rejected this API key. Check that it is active and allows this site origin.'
        : 'MapTiler could not load place suggestions. Please try again.');
      const data = await response.json();
      if (locationSearch.value.trim() !== query) return;
      renderLocationOptions(data.features || []);
      locationStatus.textContent = locationOptions.length ? 'Choose a suggested place to use it for nearby matches.' : 'No matching areas found.';
    } catch (error) {
      if (error.name === 'AbortError') return;
      hideLocationSuggestions();
      locationStatus.textContent = `${error.message || 'Could not load suggestions.'} Check your connection or try a more specific area.`;
    }
  }, 450);
});
useTypedLocation.addEventListener('click', () => {
  const label = locationSearch.value.trim();
  if (label.length < 3) return;
  profile.location = { label, latitude: null, longitude: null, source: 'manual-text' };
  locationStatus.textContent = `Location entered: ${label}`;
  locationStatus.classList.add('ok');
  useTypedLocation.hidden = true;
  hideLocationSuggestions();
});
locationSearch.addEventListener('keydown', (event) => {
  if (locationSuggestions.hidden || !locationOptions.length) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (activeLocationOption < 0) {
      activeLocationOption = event.key === 'ArrowDown' ? 0 : locationOptions.length - 1;
    } else {
      activeLocationOption = (activeLocationOption + (event.key === 'ArrowDown' ? 1 : -1) + locationOptions.length) % locationOptions.length;
    }
    [...locationSuggestions.querySelectorAll('.location-option')].forEach((option, index) => {
      option.setAttribute('aria-selected', String(index === activeLocationOption));
      if (index === activeLocationOption) option.scrollIntoView({ block: 'nearest' });
    });
    locationSearch.setAttribute('aria-activedescendant', `location-option-${activeLocationOption}`);
  } else if (event.key === 'Enter' && activeLocationOption >= 0) {
    event.preventDefault();
    selectLocation(locationOptions[activeLocationOption]);
  } else if (event.key === 'Escape') {
    hideLocationSuggestions();
  }
});
locationSearch.addEventListener('blur', () => setTimeout(hideLocationSuggestions, 150));
document.getElementById('profile-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const age = Number(document.getElementById('profile-age').value);
  const actualAge = calculateAge(document.getElementById('profile-dob').value);
  const name = document.getElementById('profile-name').value.trim();
  const validName = /^[\p{L}][\p{L}\p{M}'’ .-]{1,39}$/u.test(name);
  if (!validName) {
    form.querySelector('.auth-error').textContent = 'Enter a valid name using at least two letters.';
    document.getElementById('profile-name').focus();
    return;
  }
  if (!Number.isInteger(age) || age < 18 || age > 99 || actualAge < 18 || age !== actualAge) {
    form.querySelector('.auth-error').textContent = 'Enter your date of birth and matching age (18–99).';
    document.getElementById('profile-dob').focus();
    return;
  }
  if (!profile.location) {
    document.getElementById('location-status').textContent = 'Select a suggested city or nearby area to continue.';
    locationSearch.focus();
    return;
  }
  profile.name = name;
  profile.age = age;
  profile.gender = form.querySelector('input[name="gender"]:checked').value;
  profile.lookingFor = document.getElementById('looking-for').value;
  profile.datingIntent = document.getElementById('dating-intent').value;
  profile.bio = document.getElementById('profile-bio').value.trim();
  profile.locationLabel = profile.location.label;
  form.querySelector('.auth-error').textContent = '';
  showPanel('details-form', 3);
});

const interestInputs = [...document.querySelectorAll('#interest-options input[name="interest"]')];
const interestCount = document.getElementById('interest-count');
interestInputs.forEach((input) => input.addEventListener('change', () => {
  const selectedCount = interestInputs.filter((item) => item.checked).length;
  const error = document.querySelector('#details-form .auth-error');
  if (selectedCount > 5) {
    input.checked = false;
    error.textContent = 'Choose up to five interests.';
  } else {
    error.textContent = '';
  }
  interestCount.textContent = `${interestInputs.filter((item) => item.checked).length} of 5 selected`;
}));

const otherLanguageToggle = document.getElementById('other-language-toggle');
const otherLanguageEntry = document.getElementById('other-language-entry');
const additionalIndianLanguages = [
  'Ahirani', 'Angami', 'Angika', 'Ao', 'Awadhi', 'Bagri', 'Bhili', 'Bhotia', 'Bundeli',
  'Chhattisgarhi', 'Garo', 'Garhwali', 'Gondi', 'Haryanvi', 'Ho', 'Jaintia (Pnar)', 'Kachchi',
  'Khasi', 'Kokborok', 'Konyak', 'Korku', 'Kumaoni', 'Kurukh', 'Ladakhi', 'Lepcha', 'Lotha',
  'Magahi', 'Malvi', 'Marwari', 'Mizo', 'Monpa', 'Mundari', 'Nagpuri', 'Pahari', 'Rajasthani',
  'Sema (Sumi)', 'Sambalpuri', 'Tulu'
];
const languageOptions = document.getElementById('language-options');
const otherLanguageLabel = otherLanguageToggle.closest('label');
const motherTongueSelect = document.getElementById('mother-tongue');
additionalIndianLanguages.forEach((language) => {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  const span = document.createElement('span');
  checkbox.type = 'checkbox';
  checkbox.name = 'language';
  checkbox.value = language;
  span.textContent = language;
  label.append(checkbox, span);
  languageOptions.insertBefore(label, otherLanguageLabel);
  const option = document.createElement('option');
  option.value = language;
  option.textContent = language;
  motherTongueSelect.add(option, motherTongueSelect.options[motherTongueSelect.options.length - 1]);
});
otherLanguageToggle.addEventListener('change', () => {
  otherLanguageEntry.hidden = !otherLanguageToggle.checked;
  if (otherLanguageToggle.checked) document.getElementById('other-language-input').focus();
});
let customLanguageCount = 0;
function addCustomLanguage() {
  const input = document.getElementById('other-language-input');
  const languageName = input.value.trim().replace(/\s+/g, ' ');
  const error = document.querySelector('#details-form .auth-error');
  if (!/^[\p{L}][\p{L}\p{M} .'-]{1,39}$/u.test(languageName)) {
    error.textContent = 'Enter a language name using at least two letters.';
    input.focus();
    return;
  }
  const existing = [...document.querySelectorAll('#language-options input[name="language"]')].find((item) => item.value.toLowerCase() === languageName.toLowerCase());
  if (existing) {
    existing.checked = true;
    error.textContent = 'That language is already listed and has been selected.';
    input.value = '';
    return;
  }
  customLanguageCount += 1;
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  const span = document.createElement('span');
  checkbox.type = 'checkbox';
  checkbox.name = 'language';
  checkbox.value = languageName;
  checkbox.checked = true;
  checkbox.id = `custom-language-${customLanguageCount}`;
  span.textContent = languageName;
  label.htmlFor = checkbox.id;
  label.append(checkbox, span);
  document.getElementById('custom-language-options').append(label);
  const motherTongue = document.getElementById('mother-tongue');
  const option = document.createElement('option');
  option.value = languageName;
  option.textContent = languageName;
  motherTongue.add(option, motherTongue.options[motherTongue.options.length - 1]);
  input.value = '';
  error.textContent = '';
}
document.getElementById('add-language-button').addEventListener('click', addCustomLanguage);
document.getElementById('other-language-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addCustomLanguage();
  }
});

document.getElementById('details-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const interests = [...form.querySelectorAll('input[name="interest"]:checked')];
  const languages = [...form.querySelectorAll('input[name="language"]:checked')];
  if (!interests.length || interests.length > 5 || !languages.length) {
    form.querySelector('.auth-error').textContent = !interests.length
      ? 'Choose at least one interest to continue.'
      : interests.length > 5 ? 'Choose no more than five interests.' : 'Choose at least one language to continue.';
    (!interests.length || interests.length > 5 ? form.querySelector('input[name="interest"]') : form.querySelector('input[name="language"]')).focus();
    return;
  }
  profile.interests = interests.map((input) => input.value);
  profile.languages = languages.map((input) => input.value);
  profile.motherTongue = document.getElementById('mother-tongue').value;
  showPanel('photos-form', 4);
});
const photoInputs = [...document.querySelectorAll('.photo-slot input[type="file"]')];
photoInputs.forEach((input, index) => {
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      input.value = '';
      document.querySelector('#photos-form .auth-error').textContent = 'Please choose an image file.';
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      input.value = '';
      document.querySelector('#photos-form .auth-error').textContent = 'Each photo must be smaller than 12 MB.';
      return;
    }
    if (profile.photoUrls[index]) URL.revokeObjectURL(profile.photoUrls[index]);
    const url = URL.createObjectURL(file);
    profile.photoUrls[index] = url;
    const slot = input.closest('.photo-slot');
    slot.querySelector('.photo-preview').style.backgroundImage = `url("${url}")`;
    slot.classList.add('has-photo');
    document.querySelector('#photos-form .auth-error').textContent = '';
  });
});
document.getElementById('photos-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const chosen = photoInputs.filter((input) => input.files?.length).length;
  if (chosen < 2) {
    document.querySelector('#photos-form .auth-error').textContent = `Add ${2 - chosen} more required photo${chosen ? '' : 's'} to continue.`;
    return;
  }
  profile.company = document.getElementById('company-name').value.trim();
  saveRegisteredPhone(currentPhoneKey);
  setActiveSession(currentPhoneKey);
  showMatches();
});

const demoMatches = [
  { name: 'Mira', gender: 'Woman', age: 28, job: 'Product designer', city: 'Bengaluru', distance: 8, relation: 'A long-term relationship', family: 'Open to children', religion: 'Hindu', education: 'Graduate degree', drinking: 'Sometimes', smoking: 'No', bio: 'A tiny joy I never get tired of: finding a new breakfast spot.', tags: ['Design', 'Coffee', 'Weekend walks'], photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop&crop=faces' },
  { name: 'Rohan', gender: 'Man', age: 30, job: 'Architect', city: 'Mumbai', distance: 22, relation: 'A life partner', family: 'Want children', religion: 'Hindu', education: 'Postgraduate degree', drinking: 'Sometimes', smoking: 'No', bio: 'My ideal Sunday has a long walk and absolutely no rush.', tags: ['Architecture', 'Travel', 'Music'], photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=1100&fit=crop&crop=faces' },
  { name: 'Ari', gender: 'Non-binary', age: 27, job: 'Photographer', city: 'Pune', distance: 15, relation: 'New friends first', family: 'Prefer not to say', religion: 'Agnostic', education: 'Undergraduate degree', drinking: 'No', smoking: 'No', bio: 'I’ll always say yes to a bookstore detour.', tags: ['Photography', 'Books', 'Art'], photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&h=1100&fit=crop&crop=faces' },
  { name: 'Tashi', gender: 'Non-binary', age: 29, job: 'Illustrator', city: 'Jaipur', distance: 40, relation: 'A life partner', family: 'Open to children', religion: 'Buddhist', education: 'Graduate degree', drinking: 'Sometimes', smoking: 'No', bio: 'I can recommend a very specific playlist for your commute.', tags: ['Illustration', 'Music', 'Food'], photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900&h=1100&fit=crop&crop=faces' },
  { name: 'Kabir', gender: 'Man', age: 29, job: 'Chef', city: 'Delhi', distance: 65, relation: 'Something casual', family: 'Already have children', religion: 'Muslim', education: 'Undergraduate degree', drinking: 'Often', smoking: 'Sometimes', bio: 'I make a very serious weekend dosa.', tags: ['Cooking', 'Food', 'Comedy'], photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&h=1100&fit=crop&crop=faces' },
  { name: 'Ananya', gender: 'Woman', age: 26, job: 'Researcher', city: 'Hyderabad', distance: 18, relation: 'A long-term relationship', family: 'Want children', religion: 'Christian', education: 'Graduate degree', drinking: 'No', smoking: 'No', bio: 'Currently learning one new recipe from every trip.', tags: ['Travel', 'Food', 'Books'], photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1100&fit=crop&crop=faces' }
];
let matchFiltersInitialized = false;
const likedMatchIds = new Set();
const messagedMatchIds = new Set();
const likedBackIds = new Set();
const samplePhotoGallery = {
  Mira: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&h=1100&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=750&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=750&fit=crop&crop=faces'],
  Rohan: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=1100&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=750&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&h=750&fit=crop&crop=faces'],
  Ari: ['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&h=1100&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=750&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=750&fit=crop&crop=faces'],
  Tashi: ['https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=900&h=1100&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=750&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop&crop=faces'],
  Kabir: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&h=1100&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=750&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&h=750&fit=crop&crop=faces'],
  Ananya: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1100&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop&crop=faces', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=750&fit=crop&crop=faces']
};
function initializeMatchFilters() {
  if (profile.lookingFor) document.getElementById('filter-gender').value = profile.lookingFor;
  if (profile.datingIntent) document.getElementById('filter-relation').value = profile.datingIntent;
  matchFiltersInitialized = true;
}
function showMatches() {
  openMatchesPage();
}
const filterToggle = document.getElementById('filter-toggle');
const matchFilterPanel = document.getElementById('match-filter-panel');
function setMatchFilterPanelOpen(open) {
  matchFilterPanel.hidden = !open;
  filterToggle.setAttribute('aria-expanded', String(open));
  document.getElementById('filter-toggle-icon').textContent = open ? '−' : '＋';
}
filterToggle.addEventListener('click', () => setMatchFilterPanelOpen(matchFilterPanel.hidden));
function applyMatchFilters(event) {
  if (event) event.preventDefault();
  const minAge = Number(document.getElementById('filter-age-min').value) || 18;
  const maxAge = Number(document.getElementById('filter-age-max').value) || 99;
  const maxDistance = Number(document.getElementById('filter-distance').value);
  const gender = document.getElementById('filter-gender').value;
  const relation = document.getElementById('filter-relation').value;
  const filters = {
    family: document.getElementById('filter-family').value,
    religion: document.getElementById('filter-religion').value,
    education: document.getElementById('filter-education').value,
    drinking: document.getElementById('filter-drinks').value,
    smoking: document.getElementById('filter-smokes').value
  };
  const countLabel = document.getElementById('results-count');
  const results = document.getElementById('match-results');
  if (minAge < 18 || maxAge > 99 || minAge > maxAge) {
    countLabel.textContent = 'Enter a valid age range (18–99).';
    return;
  }
  setMatchFilterPanelOpen(false);
  visibleMatches = demoMatches.filter((match) => {
    const genderMatch = gender === 'Everyone'
      || (gender === 'Women' && match.gender === 'Woman')
      || (gender === 'Men' && match.gender === 'Man')
      || (gender === 'Non-binary people' && match.gender === 'Non-binary')
      || (gender === 'Women and men' && match.gender !== 'Non-binary');
    return genderMatch
      && (!relation || match.relation === relation)
      && match.age >= minAge && match.age <= maxAge
      && match.distance <= maxDistance
      && !likedMatchIds.has(match.name)
      && !messagedMatchIds.has(match.name)
      && Object.entries(filters).every(([key, value]) => !value || match[key] === value);
  });
  results.replaceChildren();
  document.getElementById('match-count').textContent = `${visibleMatches.length} ${visibleMatches.length === 1 ? 'profile' : 'profiles'}`;
  countLabel.textContent = visibleMatches.length ? `${visibleMatches.length} demo ${visibleMatches.length === 1 ? 'match' : 'matches'}` : 'No matches for these filters';
  if (!visibleMatches.length) {
    const empty = document.createElement('div');
    empty.className = 'matches-empty';
    empty.textContent = 'No profiles match all these choices yet. Try widening the age range or distance.';
    results.append(empty);
    return;
  }
  visibleMatches.forEach((match) => results.append(createMatchCard(match)));
}
function createMatchCard(match) {
  const card = document.createElement('article');
  card.className = 'result-card';
  const gallery = document.createElement('div');
  gallery.className = 'result-gallery';
  const photo = document.createElement('img');
  photo.className = 'result-photo';
  const photos = samplePhotoGallery[match.name] || [match.photo];
  photo.src = photos[0];
  photo.alt = `${match.name}'s profile`;
  const thumbnails = document.createElement('div');
  thumbnails.className = 'result-thumbnails';
  photos.forEach((imageUrl, index) => {
    const thumbnail = document.createElement('button');
    thumbnail.type = 'button';
    thumbnail.className = `result-thumbnail${index === 0 ? ' active' : ''}`;
    thumbnail.setAttribute('aria-label', `Show photo ${index + 1} of ${match.name}`);
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '';
    thumbnail.append(image);
    thumbnail.addEventListener('click', () => {
      photo.src = imageUrl;
      thumbnails.querySelectorAll('.result-thumbnail').forEach((item) => item.classList.remove('active'));
      thumbnail.classList.add('active');
    });
    thumbnails.append(thumbnail);
  });
  gallery.append(photo, thumbnails);
  const copy = document.createElement('div');
  copy.className = 'result-copy';
  const title = document.createElement('h3');
  title.textContent = `${match.name}, ${match.age}`;
  const subline = document.createElement('p');
  subline.className = 'result-subline';
  subline.textContent = `${match.job} · ${match.city} · ${match.distance} km away`;
  const bio = document.createElement('p');
  bio.className = 'result-bio';
  bio.textContent = match.bio;
  const aboutLabel = document.createElement('div');
  aboutLabel.className = 'result-section-label';
  aboutLabel.textContent = `About ${match.name}`;
  const interestsLabel = document.createElement('div');
  interestsLabel.className = 'result-section-label';
  interestsLabel.textContent = 'Interests';
  const tags = document.createElement('div');
  tags.className = 'result-tags';
  match.tags.forEach((tag) => {
    const chip = document.createElement('span');
    chip.textContent = tag;
    tags.append(chip);
  });
  const details = document.createElement('dl');
  details.className = 'result-details';
  [['Looking for', match.relation], ['Family plan', match.family], ['Religion', match.religion], ['Education', match.education], ['Drinks', match.drinking], ['Smokes', match.smoking]].forEach(([label, value]) => {
    const item = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value;
    item.append(term, description);
    details.append(item);
  });
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  const pass = document.createElement('button');
  pass.type = 'button';
  pass.className = 'result-pass';
  pass.textContent = 'Pass';
  pass.addEventListener('click', () => {
    card.remove();
    updateMatchResultCount('Profile passed in this preview.');
  });
  const like = document.createElement('button');
  like.type = 'button';
  like.className = 'result-like';
  like.textContent = '♡ Like';
  like.addEventListener('click', () => {
    likedMatchIds.add(match.name);
    card.remove();
    updateMatchResultCount(`You liked ${match.name}; their profile is hidden from your matches.`);
  });
  actions.append(pass, like);
  const messageLabel = document.createElement('label');
  messageLabel.className = 'message-label';
  messageLabel.textContent = `Send ${match.name} a message`;
  const messageBox = document.createElement('textarea');
  messageBox.className = 'match-message-input';
  messageBox.maxLength = 300;
  messageBox.rows = 2;
  messageBox.placeholder = 'Write a kind first message…';
  const sendMessage = document.createElement('button');
  sendMessage.type = 'button';
  sendMessage.className = 'send-message';
  sendMessage.textContent = 'Send message';
  const messageStatus = document.createElement('span');
  messageStatus.className = 'message-status';
  messageStatus.setAttribute('role', 'status');
  sendMessage.addEventListener('click', () => {
    if (!messageBox.value.trim()) {
      messageStatus.textContent = 'Write a message first.';
      messageBox.focus();
      return;
    }
    messagedMatchIds.add(match.name);
    messageStatus.textContent = '';
    card.remove();
    updateMatchResultCount(`Your message to ${match.name} is a preview only, and the profile is now hidden.`);
    messageBox.value = '';
  });
  copy.append(title, subline, aboutLabel, bio, interestsLabel, tags, details, actions, messageLabel, messageBox, sendMessage, messageStatus);
  card.append(gallery, copy);
  return card;
}
function updateMatchResultCount(message) {
  const remaining = document.querySelectorAll('#match-results .result-card').length;
  document.getElementById('match-count').textContent = `${remaining} ${remaining === 1 ? 'profile' : 'profiles'}`;
  document.getElementById('results-count').textContent = message || `${remaining} demo ${remaining === 1 ? 'match' : 'matches'} remaining`;
  document.getElementById('match-action-feedback').textContent = message || '';
  if (!remaining) {
    const empty = document.createElement('div');
    empty.className = 'matches-empty';
    empty.textContent = 'No profiles left in this preview. You can adjust your filters to keep exploring.';
    document.getElementById('match-results').append(empty);
  }
}
document.getElementById('match-filter-form').addEventListener('submit', applyMatchFilters);
document.getElementById('filter-distance').addEventListener('input', (event) => {
  document.getElementById('distance-output').textContent = `${event.target.value} km`;
});
document.getElementById('clear-match-filters').addEventListener('click', () => {
  document.getElementById('filter-gender').value = profile.lookingFor || 'Everyone';
  document.getElementById('filter-relation').value = profile.datingIntent || '';
  document.getElementById('filter-age-min').value = '18';
  document.getElementById('filter-age-max').value = '99';
  document.getElementById('filter-distance').value = '50';
  document.getElementById('distance-output').textContent = '50 km';
  ['family', 'religion', 'education', 'drinks', 'smokes'].forEach((key) => { document.getElementById(`filter-${key}`).value = ''; });
  applyMatchFilters();
});

function renderLikesPage() {
  const results = document.getElementById('likes-results');
  results.replaceChildren();
  const incomingLikes = ['Mira', 'Ari', 'Tashi']
    .filter((name) => !likedBackIds.has(name) && !messagedMatchIds.has(name))
    .map((name) => demoMatches.find((match) => match.name === name))
    .filter(Boolean);
  const remaining = incomingLikes.length;
  document.getElementById('likes-page-count').textContent = `${remaining} ${remaining === 1 ? 'person likes you' : 'people like you'}`;
  document.getElementById('likes-badge').textContent = String(remaining);
  if (!remaining) {
    const empty = document.createElement('div');
    empty.className = 'matches-empty';
    empty.textContent = 'You’ve seen all the demo likes for now. New likes will appear here when connected to a live account.';
    results.append(empty);
    return;
  }
  incomingLikes.forEach((match) => results.append(createLikeCard(match)));
}
function createLikeCard(match) {
  const card = document.createElement('article');
  card.className = 'like-card';
  const photo = document.createElement('img');
  photo.className = 'like-photo';
  photo.src = match.photo;
  photo.alt = `${match.name}'s profile`;
  const copy = document.createElement('div');
  copy.className = 'like-copy';
  const eyebrow = document.createElement('div');
  eyebrow.className = 'match-badge';
  eyebrow.textContent = '✳ LIKED YOU';
  const title = document.createElement('h2');
  title.textContent = `${match.name}, ${match.age}`;
  const subline = document.createElement('p');
  subline.className = 'result-subline';
  subline.textContent = `${match.job} · ${match.city}`;
  const bio = document.createElement('p');
  bio.className = 'result-bio';
  bio.textContent = match.bio;
  const tags = document.createElement('div');
  tags.className = 'result-tags';
  match.tags.forEach((tag) => {
    const chip = document.createElement('span');
    chip.textContent = tag;
    tags.append(chip);
  });
  const actions = document.createElement('div');
  actions.className = 'like-card-actions';
  const likeBack = document.createElement('button');
  likeBack.type = 'button';
  likeBack.className = 'result-like';
  likeBack.textContent = '♡ Like back';
  likeBack.addEventListener('click', () => {
    likedBackIds.add(match.name);
    likedMatchIds.add(match.name);
    document.getElementById('likes-feedback').textContent = `You and ${match.name} like each other in this preview.`;
    renderLikesPage();
  });
  const messageInput = document.createElement('textarea');
  messageInput.className = 'match-message-input';
  messageInput.rows = 2;
  messageInput.maxLength = 300;
  messageInput.placeholder = `Say hello to ${match.name}…`;
  const send = document.createElement('button');
  send.type = 'button';
  send.className = 'send-message';
  send.textContent = 'Send message';
  send.addEventListener('click', () => {
    if (!messageInput.value.trim()) {
      document.getElementById('likes-feedback').textContent = 'Write a message before sending.';
      messageInput.focus();
      return;
    }
    messagedMatchIds.add(match.name);
    document.getElementById('likes-feedback').textContent = `Your message to ${match.name} is a preview only, and their profile is now hidden.`;
    renderLikesPage();
  });
  actions.append(likeBack, messageInput, send);
  copy.append(eyebrow, title, subline, bio, tags, actions);
  card.append(photo, copy);
  return card;
}

if (currentPhoneKey && registeredPhones.has(currentPhoneKey)) openMatchesPage();
