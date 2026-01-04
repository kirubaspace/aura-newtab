/**
 * Aura v3.0 - Popup Script
 * Handles colors, gradients, wallpapers, favorites, history, presets, and settings
 */

const DEFAULT_COLOR = '#FFFFFF';
const MAX_HISTORY = 8;
const MAX_FAVORITES = 8;

const PRESETS = {
  focus: { gradient: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)', particles: false, weather: false },
  calm: { gradient: 'linear-gradient(135deg, #C6F6D5 0%, #E6FFFA 100%)', particles: true, weather: true },
  energy: { gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)', particles: true, weather: true },
  sunset: { gradient: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)', particles: true, weather: true },
  midnight: { gradient: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)', particles: true, weather: false },
  ocean: { gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)', particles: true, weather: true }
};

const WALLPAPER_COLLECTIONS = {
  nature: '1065976',
  minimal: '3330448',
  architecture: '1111678',
  travel: '827743'
};

let elements = {};

// ============================================
// INITIALIZATION
// ============================================

async function init() {
  cacheElements();
  const state = await getState();
  updateUI(state);
  setupEventListeners();
}

function cacheElements() {
  elements.colorSwatches = document.querySelectorAll('.color-swatch');
  elements.gradientSwatches = document.querySelectorAll('.gradient-swatch');
  elements.presetCards = document.querySelectorAll('.preset-card');
  elements.tabs = document.querySelectorAll('.tab');
  elements.tabPanels = document.querySelectorAll('.tab-panel');

  elements.customColorInput = document.getElementById('customColorInput');
  elements.hexInput = document.getElementById('hexInput');
  elements.applyCustomBtn = document.getElementById('applyCustomColor');
  elements.addFavoriteBtn = document.getElementById('addFavoriteBtn');

  elements.favoritesGrid = document.getElementById('favoritesGrid');
  elements.historyGrid = document.getElementById('historyGrid');
  elements.currentColorIndicator = document.getElementById('currentColorIndicator');

  elements.resetButton = document.getElementById('resetButton');
  elements.toast = document.getElementById('toast');
  elements.toastMessage = document.getElementById('toastMessage');

  elements.particlesToggle = document.getElementById('particlesToggle');
  elements.weatherToggle = document.getElementById('weatherToggle');

  // Wallpapers
  elements.wallpaperCats = document.querySelectorAll('.wallpaper-cat');
  elements.enableWallpaperBtn = document.getElementById('enableWallpaperBtn');
  elements.refreshWallpaperBtn = document.getElementById('refreshWallpaperBtn');
}

function setupEventListeners() {
  // Tabs
  elements.tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

  // Colors
  elements.colorSwatches.forEach(swatch => swatch.addEventListener('click', handleColorClick));

  // Gradients
  elements.gradientSwatches.forEach(swatch => swatch.addEventListener('click', handleGradientClick));

  // Presets
  elements.presetCards.forEach(card => card.addEventListener('click', () => applyPreset(card.dataset.preset)));

  // Custom color picker
  elements.customColorInput.addEventListener('input', e => elements.hexInput.value = e.target.value.toUpperCase());
  elements.hexInput.addEventListener('input', e => {
    let v = e.target.value;
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) elements.customColorInput.value = v;
  });

  elements.applyCustomBtn.addEventListener('click', handleCustomColorApply);
  elements.addFavoriteBtn.addEventListener('click', handleAddFavorite);
  elements.resetButton.addEventListener('click', handleReset);

  // Toggles
  elements.particlesToggle.addEventListener('change', () => saveState({ showParticles: elements.particlesToggle.checked }));
  elements.weatherToggle.addEventListener('change', () => saveState({ showWeather: elements.weatherToggle.checked }));

  // Wallpapers

  elements.enableWallpaperBtn.addEventListener('click', async () => {
    await saveState({ backgroundType: 'wallpaper' });
    elements.enableWallpaperBtn.classList.add('active');
    showToast('Wallpapers enabled!');
    updateUI(await getState());
  });

  elements.refreshWallpaperBtn.addEventListener('click', async () => {
    // Clear wallpaper cache to force refresh
    await new Promise(resolve => chrome.storage.local.remove(['wallpaperCache'], resolve));
    showToast('Wallpaper will refresh!');
  });
}

// ============================================
// STATE MANAGEMENT
// ============================================

async function getState() {
  return new Promise(resolve => {
    chrome.storage.sync.get([
      'backgroundColor', 'backgroundGradient', 'backgroundType',
      'favorites', 'history', 'showParticles', 'showWeather', 'wallpaperCategory'
    ], result => resolve({
      color: result.backgroundColor || DEFAULT_COLOR,
      gradient: result.backgroundGradient || null,
      type: result.backgroundType || 'wallpaper',
      favorites: result.favorites || [],
      history: result.history || [],
      showParticles: result.showParticles !== false,
      showWeather: result.showWeather !== false,
      wallpaperCategory: result.wallpaperCategory || 'nature'
    }));
  });
}

async function saveState(updates) {
  return new Promise(resolve => chrome.storage.sync.set(updates, resolve));
}

// ============================================
// UI UPDATES
// ============================================

function updateUI(state) {
  // Current indicator
  if (state.type === 'gradient' && state.gradient) {
    elements.currentColorIndicator.style.background = state.gradient;
  } else if (state.type === 'wallpaper') {
    elements.currentColorIndicator.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  } else {
    elements.currentColorIndicator.style.background = state.color;
  }

  // Color swatches selection
  elements.colorSwatches.forEach(swatch => {
    swatch.classList.toggle('selected', state.type === 'color' && swatch.dataset.color.toUpperCase() === state.color.toUpperCase());
  });

  // Gradient swatches selection
  elements.gradientSwatches.forEach(swatch => {
    swatch.classList.toggle('selected', state.type === 'gradient' && swatch.dataset.gradient === state.gradient);
  });

  // Custom color input
  if (state.type === 'color') {
    elements.customColorInput.value = state.color;
    elements.hexInput.value = state.color.toUpperCase();
  }

  // Favorites & history
  renderFavorites(state.favorites);
  renderHistory(state.history);

  // Toggles
  elements.particlesToggle.checked = state.showParticles;
  elements.weatherToggle.checked = state.showWeather;

  // Wallpaper category
  elements.wallpaperCats.forEach(cat => {
    cat.classList.toggle('active', cat.dataset.category === state.wallpaperCategory);
  });

  // Wallpaper enable button
  elements.enableWallpaperBtn.classList.toggle('active', state.type === 'wallpaper');
}

function switchTab(tabId) {
  elements.tabs.forEach(t => t.classList.remove('active'));
  elements.tabPanels.forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(`${tabId}Tab`).classList.add('active');
}

// ============================================
// COLOR HANDLERS
// ============================================

async function handleColorClick(e) {
  const swatch = e.currentTarget;
  const color = swatch.dataset.color;
  createRipple(e, swatch);
  await applyColor(color);
  await addToHistory({ type: 'color', value: color });
  showToast(swatch.title + ' applied!');
}

async function handleGradientClick(e) {
  const swatch = e.currentTarget;
  const gradient = swatch.dataset.gradient;
  await applyGradient(gradient);
  await addToHistory({ type: 'gradient', value: gradient });
  showToast(swatch.title + ' applied!');
}

async function applyColor(color) {
  await saveState({ backgroundColor: color, backgroundType: 'color', backgroundGradient: null });
  updateUI(await getState());
}

async function applyGradient(gradient) {
  await saveState({ backgroundGradient: gradient, backgroundType: 'gradient' });
  updateUI(await getState());
}

async function handleCustomColorApply() {
  let color = elements.hexInput.value.trim();
  if (!color.startsWith('#')) color = '#' + color;
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) { showToast('Invalid hex!'); return; }
  color = color.toUpperCase();
  await applyColor(color);
  await addToHistory({ type: 'color', value: color });
  showToast('Custom color applied!');
}

// ============================================
// PRESETS
// ============================================

async function applyPreset(id) {
  const preset = PRESETS[id];
  if (!preset) return;
  await applyGradient(preset.gradient);
  await saveState({ showParticles: preset.particles, showWeather: preset.weather });
  elements.particlesToggle.checked = preset.particles;
  elements.weatherToggle.checked = preset.weather;
  showToast(id.charAt(0).toUpperCase() + id.slice(1) + ' mode!');
}

// ============================================
// FAVORITES & HISTORY
// ============================================

async function handleAddFavorite() {
  const state = await getState();
  let favorites = [...state.favorites];
  const newFav = { type: state.type, value: state.type === 'gradient' ? state.gradient : state.color };

  if (favorites.some(f => f.type === newFav.type && f.value === newFav.value)) {
    showToast('Already saved!');
    return;
  }

  favorites.unshift(newFav);
  if (favorites.length > MAX_FAVORITES) favorites = favorites.slice(0, MAX_FAVORITES);
  await saveState({ favorites });
  renderFavorites(favorites);
  showToast('Added to favorites!');
}

async function removeFavorite(index) {
  const state = await getState();
  const favorites = [...state.favorites];
  favorites.splice(index, 1);
  await saveState({ favorites });
  renderFavorites(favorites);
}

async function addToHistory(item) {
  const state = await getState();
  let history = state.history.filter(h => !(h.type === item.type && h.value === item.value));
  history.unshift(item);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  await saveState({ history });
}

function renderFavorites(favorites) {
  elements.favoritesGrid.innerHTML = '';
  favorites.forEach((fav, i) => {
    const el = document.createElement('div');
    el.className = 'favorite-swatch';
    el.style.background = fav.value;
    el.onclick = () => { fav.type === 'gradient' ? applyGradient(fav.value) : applyColor(fav.value); showToast('Applied!'); };

    const rm = document.createElement('button');
    rm.className = 'remove-btn';
    rm.textContent = '×';
    rm.onclick = e => { e.stopPropagation(); removeFavorite(i); };
    el.appendChild(rm);
    elements.favoritesGrid.appendChild(el);
  });
}

function renderHistory(history) {
  elements.historyGrid.innerHTML = '';
  history.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-swatch';
    el.style.background = item.value;
    el.onclick = () => { item.type === 'gradient' ? applyGradient(item.value) : applyColor(item.value); showToast('Applied!'); };
    elements.historyGrid.appendChild(el);
  });
}

// ============================================
// RESET
// ============================================

async function handleReset() {
  await saveState({
    backgroundColor: DEFAULT_COLOR,
    backgroundType: 'wallpaper',
    backgroundGradient: null,
    showParticles: true,
    showWeather: true
  });
  updateUI(await getState());
  showToast('Reset!');
}

// ============================================
// UTILITIES
// ============================================

function createRipple(e, el) {
  const r = document.createElement('span');
  r.classList.add('ripple');
  const rect = el.getBoundingClientRect();
  const sz = Math.max(rect.width, rect.height);
  r.style.width = r.style.height = sz + 'px';
  r.style.left = (e.clientX - rect.left - sz / 2) + 'px';
  r.style.top = (e.clientY - rect.top - sz / 2) + 'px';
  el.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}

function showToast(msg) {
  elements.toastMessage.textContent = msg;
  elements.toast.classList.add('show');
  setTimeout(() => elements.toast.classList.remove('show'), 1500);
}

// ============================================
// START
// ============================================

document.addEventListener('DOMContentLoaded', init);
