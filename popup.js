/**
 * Aura - Popup Script
 * Handles color selection, gradients, favorites, history, and settings
 */

// Constants
const DEFAULT_COLOR = '#FFFFFF';
const MAX_HISTORY = 10;
const MAX_FAVORITES = 12;

// Preset configurations
const PRESETS = {
  focus: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)',
    particles: false,
    weather: false
  },
  calm: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #C6F6D5 0%, #E6FFFA 100%)',
    particles: true,
    weather: true
  },
  energy: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
    particles: true,
    weather: true
  },
  sunset: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)',
    particles: true,
    weather: true
  },
  midnight: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)',
    particles: true,
    weather: false
  },
  ocean: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    particles: true,
    weather: true
  }
};

// DOM Elements
let colorSwatches, gradientSwatches, presetCards, tabs, tabPanels;
let customColorInput, hexInput, applyCustomBtn, addFavoriteBtn;
let favoritesGrid, historyGrid, currentColorIndicator;
let resetButton, toast, toastMessage;
let particlesToggle, weatherToggle;

/**
 * Initialize the popup
 */
async function init() {
  // Cache DOM elements
  cacheElements();
  
  // Load current state from storage
  const state = await getState();
  
  // Update UI with current state
  updateUI(state);
  
  // Add event listeners
  setupEventListeners();
}

/**
 * Cache DOM elements
 */
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

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Tab navigation
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  // Color swatches
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', handleColorClick);
  });
  
  // Gradient swatches
  gradientSwatches.forEach(swatch => {
    swatch.addEventListener('click', handleGradientClick);
  });
  
  // Preset cards
  presetCards.forEach(card => {
    card.addEventListener('click', () => applyPreset(card.dataset.preset));
  });
  
  // Custom color picker
  customColorInput.addEventListener('input', (e) => {
    hexInput.value = e.target.value.toUpperCase();
  });
  
  hexInput.addEventListener('input', (e) => {
    let value = e.target.value;
    if (!value.startsWith('#')) value = '#' + value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      customColorInput.value = value;
    }
  });
  
  applyCustomBtn.addEventListener('click', handleCustomColorApply);
  
  // Add to favorites
  addFavoriteBtn.addEventListener('click', handleAddFavorite);
  
  // Reset button
  resetButton.addEventListener('click', handleReset);
  
  // Toggle switches
  particlesToggle.addEventListener('change', handleParticlesToggle);
  weatherToggle.addEventListener('change', handleWeatherToggle);
}

/**
 * Get current state from Chrome storage
 */
async function getState() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([
      'backgroundColor',
      'backgroundGradient',
      'backgroundType',
      'favorites',
      'history',
      'showParticles',
      'showWeather'
    ], (result) => {
      resolve({
        color: result.backgroundColor || DEFAULT_COLOR,
        gradient: result.backgroundGradient || null,
        type: result.backgroundType || 'color',
        favorites: result.favorites || [],
        history: result.history || [],
        showParticles: result.showParticles !== false,
        showWeather: result.showWeather !== false
      });
    });
  });
}

/**
 * Save state to Chrome storage
 */
async function saveState(updates) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(updates, resolve);
  });
}

/**
 * Update UI with current state
 */
function updateUI(state) {
  // Update current color indicator
  if (state.type === 'gradient' && state.gradient) {
    currentColorIndicator.style.background = state.gradient;
  } else {
    currentColorIndicator.style.background = state.color;
  }
  
  // Update color swatches selection
  colorSwatches.forEach(swatch => {
    swatch.classList.remove('selected');
    if (state.type === 'color' && swatch.dataset.color.toUpperCase() === state.color.toUpperCase()) {
      swatch.classList.add('selected');
    }
  });
  
  // Update gradient swatches selection
  gradientSwatches.forEach(swatch => {
    swatch.classList.remove('selected');
    if (state.type === 'gradient' && swatch.dataset.gradient === state.gradient) {
      swatch.classList.add('selected');
    }
  });
  
  // Update custom color input
  if (state.type === 'color') {
    customColorInput.value = state.color;
    hexInput.value = state.color.toUpperCase();
  }
  
  // Update favorites grid
  renderFavorites(state.favorites);
  
  // Update history grid
  renderHistory(state.history);
  
  // Update toggles
  particlesToggle.checked = state.showParticles;
  weatherToggle.checked = state.showWeather;
}

/**
 * Switch tab
 */
function switchTab(tabId) {
  tabs.forEach(t => t.classList.remove('active'));
  tabPanels.forEach(p => p.classList.remove('active'));
  
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(`${tabId}Tab`).classList.add('active');
}

/**
 * Handle color swatch click
 */
async function handleColorClick(event) {
  const swatch = event.currentTarget;
  const color = swatch.dataset.color;
  const colorName = swatch.getAttribute('title');
  
  createRipple(event, swatch);
  
  await applyColor(color);
  await addToHistory({ type: 'color', value: color });
  
  showToast(`${colorName} applied!`);
}

/**
 * Handle gradient swatch click
 */
async function handleGradientClick(event) {
  const swatch = event.currentTarget;
  const gradient = swatch.dataset.gradient;
  const gradientName = swatch.getAttribute('title');
  
  await applyGradient(gradient);
  await addToHistory({ type: 'gradient', value: gradient });
  
  showToast(`${gradientName} applied!`);
}

/**
 * Apply a solid color
 */
async function applyColor(color) {
  await saveState({
    backgroundColor: color,
    backgroundType: 'color',
    backgroundGradient: null
  });
  
  const state = await getState();
  updateUI(state);
}

/**
 * Apply a gradient
 */
async function applyGradient(gradient) {
  await saveState({
    backgroundGradient: gradient,
    backgroundType: 'gradient'
  });
  
  const state = await getState();
  updateUI(state);
}

/**
 * Handle custom color apply
 */
async function handleCustomColorApply() {
  let color = hexInput.value.trim();
  if (!color.startsWith('#')) color = '#' + color;
  
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    showToast('Invalid hex color!');
    return;
  }
  
  await applyColor(color.toUpperCase());
  await addToHistory({ type: 'color', value: color.toUpperCase() });
  
  showToast('Custom color applied!');
}

/**
 * Apply a preset
 */
async function applyPreset(presetId) {
  const preset = PRESETS[presetId];
  if (!preset) return;
  
  if (preset.type === 'gradient') {
    await applyGradient(preset.value);
  }
  
  await saveState({
    showParticles: preset.particles,
    showWeather: preset.weather
  });
  
  particlesToggle.checked = preset.particles;
  weatherToggle.checked = preset.weather;
  
  showToast(`${presetId.charAt(0).toUpperCase() + presetId.slice(1)} mode activated!`);
}

/**
 * Handle add to favorites
 */
async function handleAddFavorite() {
  const state = await getState();
  let favorites = [...state.favorites];
  
  const newFavorite = {
    type: state.type,
    value: state.type === 'gradient' ? state.gradient : state.color
  };
  
  // Check if already in favorites
  const exists = favorites.some(f => f.type === newFavorite.type && f.value === newFavorite.value);
  if (exists) {
    showToast('Already in favorites!');
    return;
  }
  
  // Add to favorites (limit to MAX_FAVORITES)
  favorites.unshift(newFavorite);
  if (favorites.length > MAX_FAVORITES) {
    favorites = favorites.slice(0, MAX_FAVORITES);
  }
  
  await saveState({ favorites });
  renderFavorites(favorites);
  
  showToast('Added to favorites!');
}

/**
 * Remove from favorites
 */
async function removeFavorite(index) {
  const state = await getState();
  const favorites = [...state.favorites];
  favorites.splice(index, 1);
  
  await saveState({ favorites });
  renderFavorites(favorites);
  
  showToast('Removed from favorites');
}

/**
 * Add to history
 */
async function addToHistory(item) {
  const state = await getState();
  let history = [...state.history];
  
  // Remove if already exists
  history = history.filter(h => !(h.type === item.type && h.value === item.value));
  
  // Add to beginning
  history.unshift(item);
  
  // Limit to MAX_HISTORY
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }
  
  await saveState({ history });
}

/**
 * Render favorites grid
 */
function renderFavorites(favorites) {
  favoritesGrid.innerHTML = '';
  
  favorites.forEach((fav, index) => {
    const el = document.createElement('div');
    el.className = `favorite-swatch ${fav.type === 'gradient' ? 'gradient' : ''}`;
    el.style.background = fav.value;
    el.title = fav.type === 'gradient' ? 'Gradient' : fav.value;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeFavorite(index);
    };
    
    el.appendChild(removeBtn);
    
    el.onclick = () => {
      if (fav.type === 'gradient') {
        applyGradient(fav.value);
      } else {
        applyColor(fav.value);
      }
      showToast('Favorite applied!');
    };
    
    favoritesGrid.appendChild(el);
  });
}

/**
 * Render history grid
 */
function renderHistory(history) {
  historyGrid.innerHTML = '';
  
  history.forEach((item) => {
    const el = document.createElement('div');
    el.className = `history-swatch ${item.type === 'gradient' ? 'gradient' : ''}`;
    el.style.background = item.value;
    el.title = item.type === 'gradient' ? 'Gradient' : item.value;
    
    el.onclick = () => {
      if (item.type === 'gradient') {
        applyGradient(item.value);
      } else {
        applyColor(item.value);
      }
      showToast('Color applied!');
    };
    
    historyGrid.appendChild(el);
  });
}

/**
 * Handle reset
 */
async function handleReset() {
  await saveState({
    backgroundColor: DEFAULT_COLOR,
    backgroundType: 'color',
    backgroundGradient: null,
    showParticles: true,
    showWeather: true
  });
  
  const state = await getState();
  updateUI(state);
  
  showToast('Reset to default');
}

/**
 * Handle particles toggle
 */
async function handleParticlesToggle() {
  await saveState({ showParticles: particlesToggle.checked });
  showToast(particlesToggle.checked ? 'Particles enabled' : 'Particles disabled');
}

/**
 * Handle weather toggle
 */
async function handleWeatherToggle() {
  await saveState({ showWeather: weatherToggle.checked });
  showToast(weatherToggle.checked ? 'Weather enabled' : 'Weather disabled');
}

/**
 * Create ripple effect
 */
function createRipple(event, element) {
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  
  element.appendChild(ripple);
  
  ripple.addEventListener('animationend', () => ripple.remove());
}

/**
 * Show toast notification
 */
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
