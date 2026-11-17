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
  if (!isMobile && siteHeader.classList.contains('menu-open')) setMobileMenu(false);
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
const profilePage = document.getElementById('profile-page');
const messagesPage = document.getElementById('messages-page');
const viewedPage = document.getElementById('viewed-page');
const subscriptionsPage = document.getElementById('subscriptions-page');
const findMatchesNav = document.getElementById('find-matches-nav');
const likesNav = document.getElementById('likes-nav');
const profileNav = document.getElementById('profile-nav');
const messagesNav = document.getElementById('messages-nav');
const viewedNav = document.getElementById('viewed-nav');
const plansNav = document.getElementById('plans-nav');
const panels = [...document.querySelectorAll('.auth-panel')];
const progress = [...document.querySelectorAll('.progress-step')];
const profile = { location: null, photoUrls: [] };
const registryStorageKey = 'goodkind-demo-registered-phones';
const sessionStorageKey = 'goodkind-demo-active-phone';
const profileStorageKey = 'goodkind-demo-profiles';
const messageStorageKey = 'goodkind-demo-conversations';
const planOffersStorageKey = 'goodkind-demo-plan-offers';
const accountSubscriptionsStorageKey = 'goodkind-demo-account-subscriptions';
const likesUsageStorageKey = 'goodkind-demo-likes-usage';
const freeDailyLikeLimit = 5;
const registeredPhones = new Set(readRegisteredPhones());
let authMode = 'register';
let editProfileMode = false;
let verifiedPhone = '';
let currentPhoneKey = readActivePhone();
let currentMatchIndex = 0;
let visibleMatches = [];
const logoutButton = document.getElementById('logout-button');
const loginButtons = [...document.querySelectorAll('.nav-actions .auth-trigger')];
const heroMatchTrigger = document.getElementById('hero-match-trigger');
const joinRegisterButton = document.getElementById('join-register-trigger');
const joinRegisterMessage = document.getElementById('join-register-message');
function readSavedProfiles() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileStorageKey) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}
function loadProfileForPhone(phone) {
  profile.photoUrls.forEach((url) => URL.revokeObjectURL(url));
  profile.photoUrls = [];
  Object.keys(profile).forEach((key) => { if (key !== 'photoUrls') delete profile[key]; });
  profile.location = null;
  const saved = readSavedProfiles()[phone];
  if (!saved) return;
  Object.assign(profile, saved);
  profile.photoUrls = [];
  profile.location = saved.locationLabel ? { label: saved.locationLabel, latitude: null, longitude: null, source: 'saved-profile' } : null;
}
function saveCurrentProfile() {
  if (!currentPhoneKey) return;
  profile.name = document.getElementById('profile-name').value.trim();
  profile.age = Number(document.getElementById('profile-age').value);
  profile.dob = document.getElementById('profile-dob').value;
  profile.bio = document.getElementById('profile-bio').value.trim();
  profile.gender = document.querySelector('#profile-form input[name="gender"]:checked')?.value || '';
  profile.lookingFor = document.getElementById('looking-for').value;
  profile.datingIntent = document.getElementById('dating-intent').value;
  profile.drinking = document.getElementById('drinking').value;
  profile.smoking = document.getElementById('smoking').value;
  profile.locationLabel = profile.location?.label || document.getElementById('location-search').value.trim();
  profile.interests = [...document.querySelectorAll('#details-form input[name="interest"]:checked')].map((input) => input.value);
  profile.languages = [...document.querySelectorAll('#details-form input[name="language"]:checked')].map((input) => input.value);
  profile.motherTongue = document.getElementById('mother-tongue').value;
  profile.familyPlan = document.getElementById('family-plan').value;
  profile.religion = document.getElementById('religion').value;
  profile.education = document.getElementById('education').value;
  profile.exercise = document.getElementById('exercise').value;
  profile.jobTitle = document.getElementById('job-title').value.trim();
  profile.company = document.getElementById('company-name').value.trim();
  profile.workplace = document.getElementById('workplace').value.trim();
  const savedProfile = { ...profile };
  delete savedProfile.location;
  delete savedProfile.photoUrls;
  const allProfiles = readSavedProfiles();
  allProfiles[currentPhoneKey] = savedProfile;
  try {
    localStorage.setItem(profileStorageKey, JSON.stringify(allProfiles));
  } catch {
    // Keep the current profile available in memory if browser storage is full or unavailable.
  }
}
function syncRegistrationCallToAction() {
  const registrationComplete = registeredPhones.size > 0;
  joinRegisterButton.disabled = registrationComplete;
  joinRegisterButton.textContent = registrationComplete ? 'Registration complete ✓' : 'Sign up with your mobile number ↗';
  joinRegisterMessage.textContent = registrationComplete
    ? 'Your account is ready. Use Find matches or Log in above.'
    : 'Your number is used to sign in and verify your account.';
}
function syncAccountNavigation() {
  const signedIn = Boolean(currentPhoneKey && registeredPhones.has(currentPhoneKey));
  findMatchesNav.classList.toggle('hidden', !signedIn);
  likesNav.classList.toggle('hidden', !signedIn);
  profileNav.classList.toggle('hidden', !signedIn);
  messagesNav.classList.toggle('hidden', !signedIn);
  viewedNav.classList.toggle('hidden', !signedIn);
  logoutButton.classList.toggle('hidden', !signedIn);
  loginButtons.forEach((button) => button.classList.toggle('hidden', signedIn));
  updateMessagesBadge();
  syncSubscriptionAccess();
  syncRegistrationCallToAction();
}
if (currentPhoneKey) loadProfileForPhone(currentPhoneKey);
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
  loadMessageFlags(phone);
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
const educationSelect = document.getElementById('education');
const jobTitleInput = document.getElementById('job-title');
const companyNameInput = document.getElementById('company-name');
function syncCollegeJobRequirements() {
  const inCollege = educationSelect.value === 'Currently in college';
  jobTitleInput.required = !inCollege;
  companyNameInput.required = !inCollege;
  document.querySelector('label[for="job-title"]').innerHTML = inCollege
    ? 'Job / profession <span class="optional-label">Optional in college</span>'
    : 'Job / profession';
  document.querySelector('label[for="company-name"]').innerHTML = inCollege
    ? 'Company name <span class="optional-label">Optional in college</span>'
    : 'Company name';
}
educationSelect.addEventListener('change', syncCollegeJobRequirements);
syncCollegeJobRequirements();
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
  if (editProfileMode) {
    editProfileMode = false;
    document.getElementById('photos-submit-button').innerHTML = 'Finish profile <span>→</span>';
  }
}
function showLandingPage() {
  matchesPage.hidden = true;
  likesPage.hidden = true;
  profilePage.hidden = true;
  messagesPage.hidden = true;
  viewedPage.hidden = true;
  subscriptionsPage.hidden = true;
  landingMain.hidden = false;
  document.body.classList.remove('matches-view');
}
function openMatchesPage() {
  closeAuth();
  landingMain.hidden = true;
  subscriptionsPage.hidden = true;
  likesPage.hidden = true;
  profilePage.hidden = true;
  messagesPage.hidden = true;
  viewedPage.hidden = true;
  matchesPage.hidden = false;
  document.body.classList.add('matches-view');
  if (!matchFiltersInitialized) initializeMatchFilters();
  applyMatchFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openLikesPage() {
  closeAuth();
  landingMain.hidden = true;
  subscriptionsPage.hidden = true;
  matchesPage.hidden = true;
  profilePage.hidden = true;
  messagesPage.hidden = true;
  viewedPage.hidden = true;
  likesPage.hidden = false;
  document.body.classList.add('matches-view');
  renderLikesPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openProfilePage() {
  closeAuth();
  landingMain.hidden = true;
  subscriptionsPage.hidden = true;
  matchesPage.hidden = true;
  likesPage.hidden = true;
  messagesPage.hidden = true;
  viewedPage.hidden = true;
  profilePage.hidden = false;
  document.body.classList.add('matches-view');
  renderProfilePage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openMessagesPage() {
  closeAuth();
  landingMain.hidden = true;
  subscriptionsPage.hidden = true;
  matchesPage.hidden = true;
  likesPage.hidden = true;
  profilePage.hidden = true;
  viewedPage.hidden = true;
  messagesPage.hidden = false;
  document.body.classList.add('matches-view');
  activeConversationName = '';
  renderMessagesPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openViewedPage() {
  closeAuth();
  landingMain.hidden = true;
  subscriptionsPage.hidden = true;
  matchesPage.hidden = true;
  likesPage.hidden = true;
  profilePage.hidden = true;
  messagesPage.hidden = true;
  viewedPage.hidden = false;
  document.body.classList.add('matches-view');
  renderViewedYouPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openSubscriptionsPage() {
  closeAuth();
  landingMain.hidden = true;
  matchesPage.hidden = true;
  likesPage.hidden = true;
  profilePage.hidden = true;
  messagesPage.hidden = true;
  viewedPage.hidden = true;
  subscriptionsPage.hidden = false;
  document.body.classList.add('matches-view');
  renderSubscriptionPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.main-nav a, .site-footer a, .site-header .brand').forEach((link) => link.addEventListener('click', () => {
  if (!matchesPage.hidden || !likesPage.hidden || !profilePage.hidden || !messagesPage.hidden || !viewedPage.hidden || !subscriptionsPage.hidden) showLandingPage();
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
profileNav.addEventListener('click', () => {
  setMobileMenu(false);
  if (currentPhoneKey && registeredPhones.has(currentPhoneKey)) openProfilePage();
  else openAuth('login');
});
messagesNav.addEventListener('click', () => {
  setMobileMenu(false);
  if (currentPhoneKey && registeredPhones.has(currentPhoneKey)) openMessagesPage();
  else openAuth('login');
});
viewedNav.addEventListener('click', () => {
  setMobileMenu(false);
  if (currentPhoneKey && registeredPhones.has(currentPhoneKey)) openViewedPage();
  else openAuth('login');
});
plansNav.addEventListener('click', () => { setMobileMenu(false); openSubscriptionsPage(); });
document.getElementById('hero-plans-trigger').addEventListener('click', openSubscriptionsPage);
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
document.querySelectorAll('.auth-trigger').forEach((button) => button.addEventListener('click', () => {
  setMobileMenu(false);
  if (button === heroMatchTrigger && currentPhoneKey && registeredPhones.has(currentPhoneKey)) {
    openMatchesPage();
    return;
  }
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
const phoneNumberInput = document.getElementById('phone-number');
phoneNumberInput.addEventListener('input', () => {
  phoneNumberInput.value = phoneNumberInput.value.replace(/\D/g, '').slice(0, 10);
});
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
    loadProfileForPhone(currentPhoneKey);
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
const requestLocationButton = document.getElementById('request-location-button');
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
  const properties = feature.properties || {};
  const local = properties.name || properties.street || properties.city || properties.district || properties.county || 'Place';
  const photonContext = [properties.city, properties.district, properties.county, properties.state, properties.country].filter(Boolean);
  return [...new Set([local, ...photonContext])].join(', ');
}
async function requestPlaceSuggestions(query, signal) {
  const photonParams = new URLSearchParams({ q: query, limit: '6', lang: 'en' });
  if (profile.location?.latitude != null && profile.location?.longitude != null) {
    photonParams.set('lat', String(profile.location.latitude));
    photonParams.set('lon', String(profile.location.longitude));
  }
  const photonResponse = await fetch(`https://photon.komoot.io/api/?${photonParams}`, { signal });
  if (!photonResponse.ok) throw new Error('Photon place search is unavailable.');
  const photonData = await photonResponse.json();
  return photonData.features || [];
}
async function reverseGeocode(latitude, longitude) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), lang: 'en' });
  try {
    const response = await fetch(`https://photon.komoot.io/reverse?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error('Could not find a nearby place name. You can enter your area manually.');
    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature) throw new Error('Could not find a nearby place name. You can enter your area manually.');
    const label = formatPlace(feature);
    if (label === 'Place') throw new Error('Could not identify a nearby area. You can enter it manually.');
    return label;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Location lookup timed out. Please try again or enter your area manually.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
function renderLocationOptions(features) {
  locationOptions = features.filter((feature) => feature?.geometry?.coordinates?.length === 2 && feature?.properties);
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
      const features = await requestPlaceSuggestions(query, locationSearchController.signal);
      if (locationSearch.value.trim() !== query) return;
      renderLocationOptions(features);
      locationStatus.textContent = locationOptions.length ? 'Choose a suggested place to use it for nearby matches.' : 'No matching areas found.';
    } catch (error) {
      if (error.name === 'AbortError') return;
      hideLocationSuggestions();
      locationStatus.textContent = 'Place suggestions could not load. Check your connection or enter your area manually.';
    }
  }, 450);
});
requestLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = 'This browser does not support location access. Enter your city or nearby area instead.';
    return;
  }
  requestLocationButton.disabled = true;
  locationStatus.textContent = 'Allow location access in your browser to find nearby areas…';
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      const label = await reverseGeocode(latitude, longitude);
      profile.location = { latitude, longitude, label, source: 'device' };
      locationSearch.value = label;
      locationStatus.textContent = `Nearby area selected: ${label}`;
      locationStatus.classList.add('ok');
      useTypedLocation.hidden = true;
      hideLocationSuggestions();
    } catch (error) {
      locationStatus.textContent = error.message || 'Could not find your nearby area. Enter it manually.';
    } finally {
      requestLocationButton.disabled = false;
    }
  }, (error) => {
    requestLocationButton.disabled = false;
    const message = error.code === 1
      ? 'Location access was not allowed. You can enter your city or nearby area instead.'
      : 'Could not read your location. Check your browser settings or enter your area manually.';
    locationStatus.textContent = message;
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
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
  profile.familyPlan = document.getElementById('family-plan').value;
  profile.religion = document.getElementById('religion').value;
  profile.education = document.getElementById('education').value;
  profile.exercise = document.getElementById('exercise').value;
  profile.jobTitle = document.getElementById('job-title').value.trim();
  profile.company = document.getElementById('company-name').value.trim();
  profile.workplace = document.getElementById('workplace').value.trim();
  showPanel('photos-form', 4);
});
function ensureEditableLanguageOption(language) {
  let checkbox = [...languageOptions.querySelectorAll('input[name="language"]')]
    .find((input) => input.value.toLowerCase() === language.toLowerCase());
  if (!checkbox) {
    const label = document.createElement('label');
    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'language';
    checkbox.value = language;
    const span = document.createElement('span');
    span.textContent = language;
    label.append(checkbox, span);
    document.getElementById('custom-language-options').append(label);
  }
  if (![...motherTongueSelect.options].some((option) => option.value === language)) {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = language;
    motherTongueSelect.add(option, motherTongueSelect.options[motherTongueSelect.options.length - 1]);
  }
  return checkbox;
}
function populateProfileEditor() {
  document.getElementById('profile-name').value = profile.name || '';
  document.getElementById('profile-age').value = profile.age ? String(profile.age).padStart(2, '0') : '';
  document.getElementById('profile-dob').value = profile.dob || '';
  document.getElementById('profile-bio').value = profile.bio || '';
  document.getElementById('bio-count').textContent = String((profile.bio || '').length);
  document.querySelectorAll('#profile-form input[name="gender"]').forEach((input) => { input.checked = input.value === profile.gender; });
  document.getElementById('looking-for').value = profile.lookingFor || '';
  document.getElementById('dating-intent').value = profile.datingIntent || '';
  document.getElementById('drinking').value = profile.drinking || '';
  document.getElementById('smoking').value = profile.smoking || '';
  document.getElementById('location-search').value = profile.locationLabel || '';
  document.getElementById('location-status').textContent = profile.locationLabel ? `Location entered: ${profile.locationLabel}` : 'Location not added yet.';
  document.getElementById('location-status').classList.toggle('ok', Boolean(profile.locationLabel));
  document.querySelectorAll('#interest-options input[name="interest"]').forEach((input) => { input.checked = (profile.interests || []).includes(input.value); });
  document.getElementById('interest-count').textContent = `${(profile.interests || []).length} of 5 selected`;
  document.querySelectorAll('#language-options input[name="language"]').forEach((input) => { input.checked = false; });
  document.getElementById('custom-language-options').replaceChildren();
  otherLanguageToggle.checked = false;
  otherLanguageEntry.hidden = true;
  (profile.languages || []).forEach((language) => { ensureEditableLanguageOption(language).checked = true; });
  if (profile.motherTongue) ensureEditableLanguageOption(profile.motherTongue);
  document.getElementById('mother-tongue').value = profile.motherTongue || '';
  document.getElementById('family-plan').value = profile.familyPlan || '';
  document.getElementById('religion').value = profile.religion || '';
  document.getElementById('education').value = profile.education || '';
  document.getElementById('exercise').value = profile.exercise || '';
  document.getElementById('job-title').value = profile.jobTitle || '';
  document.getElementById('company-name').value = profile.company || '';
  document.getElementById('workplace').value = profile.workplace || '';
  if (profile.locationLabel) profile.location = { label: profile.locationLabel, latitude: null, longitude: null, source: 'saved-profile' };
  syncCollegeJobRequirements();
}
function openProfileEditor() {
  editProfileMode = true;
  populateProfileEditor();
  document.getElementById('photos-form .auth-error').textContent = '';
  document.getElementById('photos-submit-button').innerHTML = 'Save changes <span>→</span>';
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('auth-open');
  showPanel('profile-form', 2);
}
document.getElementById('edit-profile-button').addEventListener('click', openProfileEditor);
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
  if (!editProfileMode && chosen < 2) {
    document.querySelector('#photos-form .auth-error').textContent = `Add ${2 - chosen} more required photo${chosen ? '' : 's'} to continue.`;
    return;
  }
  profile.company = document.getElementById('company-name').value.trim();
  saveCurrentProfile();
  if (editProfileMode) {
    editProfileMode = false;
    document.getElementById('photos-submit-button').innerHTML = 'Finish profile <span>→</span>';
    closeAuth();
    renderProfilePage();
    return;
  }
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
const passedMatchIds = new Set();
const passedHistory = [];
let subscriptionNotice = '';
const premiumFeatureLabels = {
  rewind: 'Rewind passed profiles',
  unlimitedLikes: 'Unlimited likes',
  advancedFilters: 'Advanced filters'
};
const defaultPlanOffers = [
  { id: 'goodkind-plus-monthly', name: 'Goodkind Plus', price: 199, billingPeriod: 'month', durationDays: 30, description: 'More freedom to find the people who feel like your people.', features: ['rewind', 'unlimitedLikes', 'advancedFilters'], published: true },
  { id: 'goodkind-plus-quarterly', name: 'Goodkind Plus · 3 months', price: 499, billingPeriod: 'quarter', durationDays: 90, description: 'Three months of thoughtful dating, with all Plus features.', features: ['rewind', 'unlimitedLikes', 'advancedFilters'], published: true }
];
function readPlanOffers() {
  try {
    const saved = JSON.parse(localStorage.getItem(planOffersStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function writePlanOffers(offers) {
  try { localStorage.setItem(planOffersStorageKey, JSON.stringify(offers)); } catch { /* Browser-only preview storage. */ }
}
function readAccountSubscriptions() {
  try {
    const saved = JSON.parse(localStorage.getItem(accountSubscriptionsStorageKey) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}
function getCurrentSubscription() {
  if (!currentPhoneKey) return null;
  const subscription = readAccountSubscriptions()[currentPhoneKey];
  const expiresAt = new Date(subscription?.expiresAt).getTime();
  if (!subscription || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  return subscription;
}
function hasSubscriptionFeature(feature) {
  return Boolean(getCurrentSubscription()?.features?.includes(feature));
}
function getCurrentLikeUsage() {
  if (!currentPhoneKey) return 0;
  try {
    const usage = JSON.parse(localStorage.getItem(likesUsageStorageKey) || '{}')[currentPhoneKey];
    return usage?.day === new Date().toISOString().slice(0, 10) ? Number(usage.count) || 0 : 0;
  } catch { return 0; }
}
function getFreeLikesRemaining() {
  return Math.max(0, freeDailyLikeLimit - getCurrentLikeUsage());
}
function recordLikeAction() {
  if (!hasSubscriptionFeature('unlimitedLikes') && getFreeLikesRemaining() <= 0) {
    subscriptionNotice = 'You’ve used your five free likes for today. Choose a plan to keep liking profiles.';
    openSubscriptionsPage();
    return false;
  }
  if (!hasSubscriptionFeature('unlimitedLikes') && currentPhoneKey) {
    try {
      const allUsage = JSON.parse(localStorage.getItem(likesUsageStorageKey) || '{}');
      allUsage[currentPhoneKey] = { day: new Date().toISOString().slice(0, 10), count: getCurrentLikeUsage() + 1 };
      localStorage.setItem(likesUsageStorageKey, JSON.stringify(allUsage));
    } catch { /* Browser-only preview storage. */ }
  }
  syncSubscriptionAccess();
  return true;
}
function saveSubscriptionForPhone(phone, plan) {
  const allSubscriptions = readAccountSubscriptions();
  const startsAt = Date.now();
  allSubscriptions[phone] = {
    planId: plan.id,
    planName: plan.name,
    features: [...(plan.features || [])],
    startsAt: new Date(startsAt).toISOString(),
    expiresAt: new Date(startsAt + Number(plan.durationDays) * 86400000).toISOString()
  };
  try { localStorage.setItem(accountSubscriptionsStorageKey, JSON.stringify(allSubscriptions)); } catch { /* Browser-only preview storage. */ }
}
function syncSubscriptionAccess() {
  const advancedUnlocked = hasSubscriptionFeature('advancedFilters');
  document.querySelectorAll('.premium-filter select').forEach((select) => { select.disabled = !advancedUnlocked; });
  const advancedNote = document.getElementById('advanced-filter-note');
  if (advancedNote) advancedNote.hidden = advancedUnlocked;
  const likeLabel = document.getElementById('free-like-count');
  if (likeLabel) likeLabel.textContent = hasSubscriptionFeature('unlimitedLikes') ? 'Unlimited likes' : `${getFreeLikesRemaining()} free likes left today`;
  const rewindButton = document.getElementById('rewind-match-button');
  if (rewindButton) rewindButton.innerHTML = hasSubscriptionFeature('rewind') ? '↶ Rewind' : '↶ Rewind <span>✦</span>';
}
function initializePlanOffers() {
  try {
    if (localStorage.getItem(planOffersStorageKey) === null) writePlanOffers(defaultPlanOffers);
  } catch { writePlanOffers(defaultPlanOffers); }
}
function renderSubscriptionPage() {
  const container = document.getElementById('subscription-plans');
  container.replaceChildren();
  const status = document.getElementById('current-plan-status');
  const current = getCurrentSubscription();
  const expiresText = current ? new Date(current.expiresAt).toLocaleDateString() : '';
  status.textContent = subscriptionNotice || (current ? `${current.planName} is active until ${expiresText}.` : currentPhoneKey ? 'You’re on the free plan. Choose a membership to unlock more ways to connect.' : 'Sign in or create an account to activate a plan.');
  subscriptionNotice = '';
  const freeCard = document.createElement('article');
  freeCard.className = 'subscription-card free-plan-card';
  freeCard.innerHTML = '<div class="section-kicker">A GOOD START</div><h2>Free</h2><p class="subscription-price">₹0 <span>always</span></p><p>Get to know Goodkind at your own pace.</p>';
  const freeList = document.createElement('ul');
  ['Browse profiles and send messages', `${freeDailyLikeLimit} likes per day`, 'Gender, age, and distance filters'].forEach((item) => { const li = document.createElement('li'); li.textContent = item; freeList.append(li); });
  const freeButton = document.createElement('button');
  freeButton.type = 'button'; freeButton.className = 'button button-light'; freeButton.textContent = current ? 'Included with your account' : 'Create a free account';
  freeButton.disabled = Boolean(currentPhoneKey);
  freeButton.addEventListener('click', () => openAuth('register'));
  freeCard.append(freeList, freeButton);
  container.append(freeCard);
  readPlanOffers().filter((plan) => plan.published).forEach((plan) => {
    const card = document.createElement('article'); card.className = 'subscription-card premium-plan-card';
    const kicker = document.createElement('div'); kicker.className = 'section-kicker'; kicker.textContent = 'MORE WAYS TO CONNECT';
    const title = document.createElement('h2'); title.textContent = plan.name;
    const price = document.createElement('p'); price.className = 'subscription-price'; price.textContent = `₹${plan.price} `;
    const billing = document.createElement('span'); billing.textContent = ` / ${plan.billingPeriod}`; price.append(billing);
    const description = document.createElement('p'); description.textContent = plan.description || 'A little more freedom to find your person.';
    const features = document.createElement('ul');
    Object.entries(premiumFeatureLabels).forEach(([feature, label]) => { if (plan.features?.includes(feature)) { const li = document.createElement('li'); li.textContent = `✓ ${label}`; features.append(li); } });
    const button = document.createElement('button'); button.type = 'button'; button.className = 'button button-dark';
    const isCurrent = current?.planId === plan.id;
    button.textContent = isCurrent ? 'Current plan' : currentPhoneKey ? 'Activate demo subscription' : 'Sign in to subscribe';
    button.disabled = isCurrent;
    button.addEventListener('click', () => {
      if (!currentPhoneKey) { openAuth('login'); return; }
      saveSubscriptionForPhone(currentPhoneKey, plan);
      syncAccountNavigation();
      renderSubscriptionPage();
    });
    card.append(kicker, title, price, description, features, button);
    container.append(card);
  });
}
document.getElementById('advanced-filter-upgrade').addEventListener('click', () => {
  subscriptionNotice = 'Advanced filters are included with a paid plan.';
  openSubscriptionsPage();
});
document.getElementById('rewind-match-button').addEventListener('click', () => {
  if (!hasSubscriptionFeature('rewind')) {
    subscriptionNotice = 'Rewind is a member feature. Choose a plan to bring a passed profile back.';
    openSubscriptionsPage();
    return;
  }
  const previousName = passedHistory.pop();
  if (!previousName) {
    document.getElementById('match-action-feedback').textContent = 'No recently passed profiles to rewind.';
    return;
  }
  passedMatchIds.delete(previousName);
  applyMatchFilters();
  document.getElementById('match-action-feedback').textContent = `${previousName} is back in your matches.`;
});
let activeConversationName = '';
const demoProfileViews = ['Mira', 'Ari', 'Tashi'];
function readConversations(phone = currentPhoneKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(messageStorageKey) || '{}');
    return Array.isArray(saved?.[phone]) ? saved[phone] : [];
  } catch {
    return [];
  }
}
function writeConversations(phone, conversations) {
  try {
    const saved = JSON.parse(localStorage.getItem(messageStorageKey) || '{}');
    saved[phone] = conversations;
    localStorage.setItem(messageStorageKey, JSON.stringify(saved));
  } catch {
    // Keep messaging usable in memory when browser storage is unavailable.
  }
}
function updateMessagesBadge() {
  const count = currentPhoneKey ? readConversations().length : 0;
  const badge = document.getElementById('messages-badge');
  if (badge) badge.textContent = String(count);
}
function loadMessageFlags(phone) {
  messagedMatchIds.clear();
  readConversations(phone).forEach((conversation) => {
    if (conversation.name && conversation.messages?.length) messagedMatchIds.add(conversation.name);
  });
  updateMessagesBadge();
}
function addSentMessage(name, text) {
  if (!currentPhoneKey) return;
  const conversations = readConversations();
  let conversation = conversations.find((item) => item.name === name);
  if (!conversation) {
    conversation = { name, messages: [] };
    conversations.unshift(conversation);
  }
  conversation.messages.push({ direction: 'sent', text: text.trim(), sentAt: new Date().toISOString() });
  conversation.updatedAt = new Date().toISOString();
  writeConversations(currentPhoneKey, conversations);
  messagedMatchIds.add(name);
  updateMessagesBadge();
}
function renderMessagesPage() {
  const list = document.getElementById('conversation-list');
  const thread = document.getElementById('conversation-thread');
  const conversations = readConversations().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  list.replaceChildren();
  thread.replaceChildren();
  if (!conversations.length) {
    const empty = document.createElement('div');
    empty.className = 'conversation-empty';
    empty.textContent = 'No messages yet. Say hello to someone from Find matches.';
    list.append(empty);
    thread.append(empty.cloneNode(true));
    updateMessagesBadge();
    return;
  }
  if (!conversations.some((item) => item.name === activeConversationName)) activeConversationName = conversations[0].name;
  conversations.forEach((conversation) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `conversation-item${conversation.name === activeConversationName ? ' active' : ''}`;
    const name = document.createElement('strong');
    name.textContent = conversation.name;
    const preview = document.createElement('span');
    preview.textContent = conversation.messages.at(-1)?.text || 'Start a conversation';
    button.append(name, preview);
    button.addEventListener('click', () => { activeConversationName = conversation.name; renderMessagesPage(); });
    list.append(button);
  });
  const selected = conversations.find((item) => item.name === activeConversationName);
  const heading = document.createElement('h2');
  heading.textContent = selected.name;
  const messageList = document.createElement('div');
  messageList.className = 'message-thread-list';
  selected.messages.forEach((message) => {
    const bubble = document.createElement('p');
    bubble.className = `message-bubble ${message.direction === 'sent' ? 'sent' : 'received'}`;
    bubble.textContent = message.text;
    messageList.append(bubble);
  });
  const composer = document.createElement('form');
  composer.className = 'conversation-composer';
  const input = document.createElement('textarea');
  input.maxLength = 300;
  input.rows = 2;
  input.placeholder = `Write a follow-up to ${selected.name}…`;
  input.setAttribute('aria-label', `Message ${selected.name}`);
  const send = document.createElement('button');
  send.type = 'submit';
  send.className = 'button button-dark';
  send.textContent = 'Send message';
  composer.append(input, send);
  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input.value.trim()) { input.focus(); return; }
    addSentMessage(selected.name, input.value);
    renderMessagesPage();
  });
  thread.append(heading, messageList, composer);
  updateMessagesBadge();
}
function renderViewedYouPage() {
  const results = document.getElementById('viewed-results');
  const visitors = demoProfileViews.map((name) => demoMatches.find((match) => match.name === name)).filter(Boolean);
  results.replaceChildren();
  document.getElementById('viewed-count').textContent = `${visitors.length} ${visitors.length === 1 ? 'person viewed' : 'people viewed'} your profile`;
  visitors.forEach((match) => results.append(createMatchCard(match, 'viewed')));
}
if (currentPhoneKey) loadMessageFlags(currentPhoneKey);
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
  const advancedFiltersEnabled = hasSubscriptionFeature('advancedFilters');
  const relation = advancedFiltersEnabled ? document.getElementById('filter-relation').value : '';
  const filters = {
    family: advancedFiltersEnabled ? document.getElementById('filter-family').value : '',
    religion: advancedFiltersEnabled ? document.getElementById('filter-religion').value : '',
    education: advancedFiltersEnabled ? document.getElementById('filter-education').value : '',
    drinking: advancedFiltersEnabled ? document.getElementById('filter-drinks').value : '',
    smoking: advancedFiltersEnabled ? document.getElementById('filter-smokes').value : ''
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
      && !passedMatchIds.has(match.name)
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
function createMatchCard(match, context = 'matches') {
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
  if (context === 'viewed') {
    const viewedBadge = document.createElement('div');
    viewedBadge.className = 'match-badge viewed-badge';
    viewedBadge.textContent = '◉ VISITED YOUR PROFILE';
    copy.append(viewedBadge);
  }
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
    if (context === 'matches') {
      passedMatchIds.add(match.name);
      passedHistory.push(match.name);
    }
    card.remove();
    if (context === 'matches') updateMatchResultCount('Profile passed in this preview.');
    else document.getElementById('viewed-action-feedback').textContent = `${match.name} was removed from your viewed list.`;
  });
  const like = document.createElement('button');
  like.type = 'button';
  like.className = 'result-like';
  like.textContent = '♡ Like';
  like.addEventListener('click', () => {
    if (!recordLikeAction()) return;
    likedMatchIds.add(match.name);
    card.remove();
    const status = `You liked ${match.name}; their profile is hidden from your matches.`;
    if (context === 'matches') updateMatchResultCount(status);
    else document.getElementById('viewed-action-feedback').textContent = status;
  });
  const messageTrigger = document.createElement('button');
  messageTrigger.type = 'button';
  messageTrigger.className = 'result-message';
  messageTrigger.textContent = 'Message';
  actions.append(pass, like, messageTrigger);
  const composer = document.createElement('div');
  composer.className = 'match-message-composer';
  composer.hidden = true;
  const messageLabel = document.createElement('label');
  messageLabel.className = 'message-label';
  messageLabel.htmlFor = `message-${match.name.toLowerCase()}`;
  messageLabel.textContent = `Send ${match.name} a message`;
  const messageBox = document.createElement('textarea');
  messageBox.className = 'match-message-input';
  messageBox.id = `message-${match.name.toLowerCase()}`;
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
  messageTrigger.addEventListener('click', () => {
    composer.hidden = !composer.hidden;
    if (!composer.hidden) messageBox.focus();
  });
  sendMessage.addEventListener('click', () => {
    if (!messageBox.value.trim()) {
      messageStatus.textContent = 'Write a message first.';
      messageBox.focus();
      return;
    }
    addSentMessage(match.name, messageBox.value);
    messageStatus.textContent = '';
    card.remove();
    const status = `Your message to ${match.name} was saved in Messages; their profile is now hidden.`;
    if (context === 'matches') updateMatchResultCount(status);
    else document.getElementById('viewed-action-feedback').textContent = status;
    messageBox.value = '';
  });
  composer.append(messageLabel, messageBox, sendMessage, messageStatus);
  copy.append(title, subline, aboutLabel, bio, interestsLabel, tags, details, actions, composer);
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
    if (!recordLikeAction()) return;
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
    addSentMessage(match.name, messageInput.value);
    document.getElementById('likes-feedback').textContent = `Your message to ${match.name} was saved in Messages, and their profile is now hidden.`;
    renderLikesPage();
  });
  actions.append(likeBack, messageInput, send);
  copy.append(eyebrow, title, subline, bio, tags, actions);
  card.append(photo, copy);
  return card;
}

function renderProfilePage() {
  const hasProfile = Boolean(profile.name);
  const emptyMessage = document.getElementById('profile-page-empty');
  const profileCard = document.querySelector('.profile-page-card');
  emptyMessage.hidden = hasProfile;
  profileCard.hidden = !hasProfile;
  if (!hasProfile) {
    document.getElementById('profile-display-name').textContent = 'Your profile';
    document.getElementById('profile-display-location').textContent = '';
    return;
  }
  document.getElementById('profile-display-name').textContent = `${profile.name}${profile.age ? `, ${profile.age}` : ''}`;
  document.getElementById('profile-display-location').textContent = [profile.gender, profile.locationLabel].filter(Boolean).join(' · ');
  document.getElementById('profile-display-bio').textContent = profile.bio || 'Add a bio to help people get to know you.';
  const gallery = document.getElementById('profile-photo-gallery');
  gallery.replaceChildren();
  const photos = (profile.photoUrls || []).filter(Boolean);
  if (!photos.length) {
    const placeholder = document.createElement('div');
    placeholder.className = 'profile-photo-placeholder';
    placeholder.textContent = 'Your photos will appear here';
    gallery.append(placeholder);
  } else {
    photos.forEach((url, index) => {
      const image = document.createElement('img');
      image.className = 'profile-photo';
      image.src = url;
      image.alt = `${profile.name}'s photo ${index + 1}`;
      gallery.append(image);
    });
  }
  const interests = document.getElementById('profile-display-interests');
  interests.replaceChildren();
  (profile.interests || []).forEach((value) => {
    const chip = document.createElement('span');
    chip.textContent = value;
    interests.append(chip);
  });
  const details = document.getElementById('profile-display-details');
  details.replaceChildren();
  [
    ['Looking for', profile.lookingFor], ['Relationship', profile.datingIntent], ['Languages', (profile.languages || []).join(', ')],
    ['Mother tongue', profile.motherTongue], ['Family plans', profile.familyPlan], ['Religion', profile.religion],
    ['Education', profile.education], ['Exercise', profile.exercise], ['Job', profile.jobTitle],
    ['Company', profile.company], ['Workplace', profile.workplace], ['Drinking', profile.drinking], ['Smoking', profile.smoking]
  ].filter(([, value]) => Boolean(value)).forEach(([label, value]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    details.append(row);
  });
}

initializePlanOffers();
syncSubscriptionAccess();
if (currentPhoneKey && registeredPhones.has(currentPhoneKey)) openMatchesPage();
