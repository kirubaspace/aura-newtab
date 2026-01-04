/**
 * Aura - Popup Script
 * Handles color selection, gradients, favorites, history, and settings
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

let colorSwatches, gradientSwatches, presetCards, tabs, tabPanels;
let customColorInput, hexInput, applyCustomBtn, addFavoriteBtn;
let favoritesGrid, historyGrid, currentColorIndicator;
let resetButton, toast, toastMessage;
let particlesToggle, weatherToggle;

async function init() {
  cacheElements();
  const state = await getState();
  updateUI(state);
  setupEventListeners();
}

function cacheElements() {
  colorSwatches = document.querySelectorAll('.color-swatch');
  gradientSwatches = document.querySelectorAll('.gradient-swatch');
  presetCards = document.querySelectorAll('.preset-card');
  tabs = document.querySelectorAll('.tab');
  tabPanels = document.querySelectorAll('.tab-panel');

  customColorInput = document.getElementById('customColorInput');
  hexInput = document.getElementById('hexInput');
  applyCustomBtn = document.getElementById('applyCustomColor');
  addFavoriteBtn = document.getElementById('addFavoriteBtn');

  favoritesGrid = document.getElementById('favoritesGrid');
  historyGrid = document.getElementById('historyGrid');
  currentColorIndicator = document.getElementById('currentColorIndicator');

  resetButton = document.getElementById('resetButton');
  toast = document.getElementById('toast');
  toastMessage = document.getElementById('toastMessage');

  particlesToggle = document.getElementById('particlesToggle');
  weatherToggle = document.getElementById('weatherToggle');
}

function setupEventListeners() {
  tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  colorSwatches.forEach(swatch => swatch.addEventListener('click', handleColorClick));
  gradientSwatches.forEach(swatch => swatch.addEventListener('click', handleGradientClick));
  presetCards.forEach(card => card.addEventListener('click', () => applyPreset(card.dataset.preset)));

  customColorInput.addEventListener('input', e => hexInput.value = e.target.value.toUpperCase());
  hexInput.addEventListener('input', e => {
    let v = e.target.value;
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) customColorInput.value = v;
  });

  applyCustomBtn.addEventListener('click', handleCustomColorApply);
  addFavoriteBtn.addEventListener('click', handleAddFavorite);
  resetButton.addEventListener('click', handleReset);
  particlesToggle.addEventListener('change', () => saveState({ showParticles: particlesToggle.checked }));
  weatherToggle.addEventListener('change', () => saveState({ showWeather: weatherToggle.checked }));
}

async function getState() {
  return new Promise(resolve => {
    chrome.storage.sync.get([
      'backgroundColor', 'backgroundGradient', 'backgroundType',
      'favorites', 'history', 'showParticles', 'showWeather'
    ], result => resolve({
      color: result.backgroundColor || DEFAULT_COLOR,
      gradient: result.backgroundGradient || null,
      type: result.backgroundType || 'color',
      favorites: result.favorites || [],
      history: result.history || [],
      showParticles: result.showParticles !== false,
      showWeather: result.showWeather !== false
    }));
  });
}

async function saveState(updates) {
  return new Promise(resolve => chrome.storage.sync.set(updates, resolve));
}

function updateUI(state) {
  currentColorIndicator.style.background = state.type === 'gradient' && state.gradient ? state.gradient : state.color;

  colorSwatches.forEach(swatch => {
    swatch.classList.toggle('selected', state.type === 'color' && swatch.dataset.color.toUpperCase() === state.color.toUpperCase());
  });

  gradientSwatches.forEach(swatch => {
    swatch.classList.toggle('selected', state.type === 'gradient' && swatch.dataset.gradient === state.gradient);
  });

  if (state.type === 'color') {
    customColorInput.value = state.color;
    hexInput.value = state.color.toUpperCase();
  }

  renderFavorites(state.favorites);
  renderHistory(state.history);
  particlesToggle.checked = state.showParticles;
  weatherToggle.checked = state.showWeather;
}

function switchTab(tabId) {
  tabs.forEach(t => t.classList.remove('active'));
  tabPanels.forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(`${tabId}Tab`).classList.add('active');
}

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
  let color = hexInput.value.trim();
  if (!color.startsWith('#')) color = '#' + color;
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) { showToast('Invalid hex!'); return; }
  color = color.toUpperCase();
  await applyColor(color);
  await addToHistory({ type: 'color', value: color });
  showToast('Custom color applied!');
}

async function applyPreset(id) {
  const preset = PRESETS[id];
  if (!preset) return;
  await applyGradient(preset.gradient);
  await saveState({ showParticles: preset.particles, showWeather: preset.weather });
  particlesToggle.checked = preset.particles;
  weatherToggle.checked = preset.weather;
  showToast(id.charAt(0).toUpperCase() + id.slice(1) + ' mode!');
}

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
  favoritesGrid.innerHTML = '';
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
    favoritesGrid.appendChild(el);
  });
}

function renderHistory(history) {
  historyGrid.innerHTML = '';
  history.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-swatch';
    el.style.background = item.value;
    el.onclick = () => { item.type === 'gradient' ? applyGradient(item.value) : applyColor(item.value); showToast('Applied!'); };
    historyGrid.appendChild(el);
  });
}

async function handleReset() {
  await saveState({ backgroundColor: DEFAULT_COLOR, backgroundType: 'color', backgroundGradient: null, showParticles: true, showWeather: true });
  updateUI(await getState());
  showToast('Reset!');
}

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
  toastMessage.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

document.addEventListener('DOMContentLoaded', init);
