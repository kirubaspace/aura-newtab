/**
 * Aura - New Tab Script
 * Enhanced new tab experience with search, weather, particles, and more
 */

// Constants
const DEFAULT_COLOR = '#FFFFFF';
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const SEARCH_ENGINES = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' }
};

// Weather icon mapping
const WEATHER_ICONS = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

// DOM Elements
let timeElement, greetingElement, dateElement;
let searchInput, searchEngineToggle, searchEngineName;
let weatherWidget, weatherLoading, weatherContent, weatherError;
let weatherIcon, weatherTemp, weatherDesc, weatherLocation;
let particlesCanvas, focusModeBtn, quickLinksContainer, quickLinks;

// State
let currentSearchEngine = 'google';
let particles = [];
let animationFrame;

/**
 * Initialize the new tab page
 */
async function init() {
    // Cache DOM elements
    cacheElements();

    // Load settings and apply background
    await applySettings();

    // Initialize features
    updateTime();
    setInterval(updateTime, 1000);

    // Setup search
    setupSearch();

    // Load weather if enabled
    loadWeatherIfEnabled();

    // Initialize particles if enabled
    initParticlesIfEnabled();

    // Setup focus mode
    setupFocusMode();

    // Setup quick links
    setupQuickLinks();

    // Listen for storage changes
    chrome.storage.onChanged.addListener(handleStorageChange);
}

/**
 * Cache DOM elements
 */
function cacheElements() {
    timeElement = document.getElementById('time');
    greetingElement = document.getElementById('greeting');
    dateElement = document.getElementById('date');

    searchInput = document.getElementById('searchInput');
    searchEngineToggle = document.getElementById('searchEngineToggle');
    searchEngineName = document.getElementById('searchEngineName');

    weatherWidget = document.getElementById('weatherWidget');
    weatherLoading = document.getElementById('weatherLoading');
    weatherContent = document.getElementById('weatherContent');
    weatherError = document.getElementById('weatherError');
    weatherIcon = document.getElementById('weatherIcon');
    weatherTemp = document.getElementById('weatherTemp');
    weatherDesc = document.getElementById('weatherDesc');
    weatherLocation = document.getElementById('weatherLocation');

    particlesCanvas = document.getElementById('particlesCanvas');
    focusModeBtn = document.getElementById('focusModeBtn');
    quickLinksContainer = document.getElementById('quickLinksContainer');
    quickLinks = document.getElementById('quickLinks');
}

/**
 * Apply saved settings
 */
async function applySettings() {
    const result = await new Promise((resolve) => {
        chrome.storage.sync.get([
            'backgroundColor',
            'backgroundGradient',
            'backgroundType',
            'showParticles',
            'showWeather',
            'searchEngine',
            'focusMode'
        ], resolve);
    });

    // Apply background
    if (result.backgroundType === 'gradient' && result.backgroundGradient) {
        document.body.style.background = result.backgroundGradient;
        document.body.style.backgroundSize = 'cover';
    } else {
        const color = result.backgroundColor || DEFAULT_COLOR;
        document.body.style.background = color;
    }

    // Determine text color
    updateTextColor();

    // Apply search engine preference
    currentSearchEngine = result.searchEngine || 'google';
    searchEngineName.textContent = SEARCH_ENGINES[currentSearchEngine].name;

    // Apply focus mode if saved
    if (result.focusMode) {
        document.body.classList.add('focus-mode');
        focusModeBtn.classList.add('active');
    }
}

/**
 * Update text color based on background
 */
function updateTextColor() {
    const bg = document.body.style.background || document.body.style.backgroundColor;
    const isLight = isLightBackground(bg);

    document.body.classList.toggle('light-bg', isLight);
    document.body.classList.toggle('dark-bg', !isLight);
}

/**
 * Determine if background is light
 */
function isLightBackground(bg) {
    // For gradients, check the first color
    const colorMatch = bg.match(/#([0-9A-Fa-f]{6})/);
    if (!colorMatch) return true;

    const hex = colorMatch[1];
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 128;
}

/**
 * Update time display
 */
function updateTime() {
    const now = new Date();

    // Format time
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}`;

    // Update greeting
    const hour = now.getHours();
    let greeting = 'Good evening';

    if (hour >= 5 && hour < 12) {
        greeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
        greeting = 'Good evening';
    } else {
        greeting = 'Good night';
    }

    greetingElement.textContent = greeting;

    // Update date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Setup search functionality
 */
function setupSearch() {
    // Handle search input
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            const query = encodeURIComponent(searchInput.value.trim());
            const url = SEARCH_ENGINES[currentSearchEngine].url + query;
            window.location.href = url;
        }
    });

    // Handle search engine toggle
    searchEngineToggle.addEventListener('click', () => {
        const engines = Object.keys(SEARCH_ENGINES);
        const currentIndex = engines.indexOf(currentSearchEngine);
        const nextIndex = (currentIndex + 1) % engines.length;
        currentSearchEngine = engines[nextIndex];

        searchEngineName.textContent = SEARCH_ENGINES[currentSearchEngine].name;

        // Save preference
        chrome.storage.sync.set({ searchEngine: currentSearchEngine });
    });

    // Focus search on page load
    setTimeout(() => searchInput.focus(), 500);
}

/**
 * Load weather if enabled
 */
async function loadWeatherIfEnabled() {
    const result = await new Promise((resolve) => {
        chrome.storage.sync.get(['showWeather'], resolve);
    });

    if (result.showWeather === false) {
        weatherWidget.classList.add('hidden');
        return;
    }

    loadWeather();
}

/**
 * Load weather data
 */
async function loadWeather() {
    // Check cache first
    const cached = await getCachedWeather();
    if (cached) {
        displayWeather(cached);
        return;
    }

    // Use IP-based location (no permission needed)
    try {
        const locationResponse = await fetch('https://ipapi.co/json/');
        if (!locationResponse.ok) throw new Error('Location failed');

        const locationData = await locationResponse.json();
        const weather = await fetchWeather(locationData.latitude, locationData.longitude, locationData.city);
        displayWeather(weather);
        cacheWeather(weather);
    } catch (error) {
        showWeatherError();
    }
}

/**
 * Fetch weather from API
 */
async function fetchWeather(lat, lon, cityName) {
    // Using Open-Meteo API (free, no API key required)
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    );

    if (!response.ok) throw new Error('Weather fetch failed');

    const data = await response.json();

    return {
        temp: Math.round(data.current.temperature_2m),
        code: data.current.weather_code,
        location: cityName || 'Your Location',
        timestamp: Date.now()
    };
}

/**
 * Get weather icon from code
 */
function getWeatherIcon(code) {
    // WMO Weather codes mapping
    const iconMap = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌧️', 53: '🌧️', 55: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '❄️', 73: '❄️', 75: '❄️',
        77: '❄️', 80: '🌦️', 81: '🌦️', 82: '🌦️',
        85: '🌨️', 86: '🌨️',
        95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return iconMap[code] || '🌡️';
}

/**
 * Get weather description from code
 */
function getWeatherDesc(code) {
    const descMap = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Rime fog',
        51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
        61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
        71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
        77: 'Snow grains', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
        85: 'Light snow showers', 86: 'Snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm'
    };
    return descMap[code] || 'Unknown';
}

/**
 * Display weather data
 */
function displayWeather(weather) {
    weatherLoading.style.display = 'none';
    weatherError.style.display = 'none';
    weatherContent.style.display = 'flex';

    weatherIcon.textContent = getWeatherIcon(weather.code);
    weatherTemp.textContent = `${weather.temp}°C`;
    weatherDesc.textContent = getWeatherDesc(weather.code);
    weatherLocation.textContent = weather.location;
}

/**
 * Show weather error
 */
function showWeatherError() {
    weatherLoading.style.display = 'none';
    weatherContent.style.display = 'none';
    weatherError.style.display = 'flex';

    weatherError.onclick = () => {
        weatherLoading.style.display = 'flex';
        weatherError.style.display = 'none';
        loadWeather();
    };
}

/**
 * Get cached weather
 */
async function getCachedWeather() {
    const result = await new Promise((resolve) => {
        chrome.storage.local.get(['weatherCache'], resolve);
    });

    if (result.weatherCache) {
        const age = Date.now() - result.weatherCache.timestamp;
        if (age < WEATHER_CACHE_DURATION) {
            return result.weatherCache;
        }
    }
    return null;
}

/**
 * Cache weather data
 */
function cacheWeather(weather) {
    chrome.storage.local.set({ weatherCache: weather });
}

/**
 * Initialize particles if enabled
 */
async function initParticlesIfEnabled() {
    const result = await new Promise((resolve) => {
        chrome.storage.sync.get(['showParticles'], resolve);
    });

    if (result.showParticles === false) {
        particlesCanvas.classList.remove('active');
        return;
    }

    initParticles();
}

/**
 * Initialize particle system
 */
function initParticles() {
    const canvas = particlesCanvas;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));
    particles = [];

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2
        });
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isLight = document.body.classList.contains('light-bg');
        const particleColor = isLight ? '0, 0, 0' : '255, 255, 255';

        particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
            ctx.fill();
        });

        // Draw connections
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${particleColor}, ${0.1 * (1 - distance / 120)})`;
                    ctx.stroke();
                }
            });
        });

        animationFrame = requestAnimationFrame(animate);
    }

    canvas.classList.add('active');
    animate();
}

/**
 * Setup focus mode
 */
function setupFocusMode() {
    focusModeBtn.addEventListener('click', async () => {
        document.body.classList.toggle('focus-mode');
        focusModeBtn.classList.toggle('active');

        const isFocusMode = document.body.classList.contains('focus-mode');
        await chrome.storage.sync.set({ focusMode: isFocusMode });
    });
}

/**
 * Setup quick links
 */
function setupQuickLinks() {
    // Default quick links
    const defaultLinks = [
        { name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
        { name: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
        { name: 'GitHub', url: 'https://github.com', icon: '💻' },
        { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' }
    ];

    quickLinks.innerHTML = '';

    defaultLinks.forEach(link => {
        const el = document.createElement('a');
        el.href = link.url;
        el.className = 'quick-link';
        el.innerHTML = `
            <div class="quick-link-icon">${link.icon}</div>
            <span class="quick-link-name">${link.name}</span>
        `;
        quickLinks.appendChild(el);
    });
}

/**
 * Handle storage changes
 */
function handleStorageChange(changes, area) {
    if (area !== 'sync') return;

    // Handle background changes
    if (changes.backgroundColor || changes.backgroundGradient || changes.backgroundType) {
        applySettings();
    }

    // Handle particle toggle
    if (changes.showParticles) {
        if (changes.showParticles.newValue) {
            initParticles();
        } else {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            particlesCanvas.classList.remove('active');
        }
    }

    // Handle weather toggle
    if (changes.showWeather) {
        if (changes.showWeather.newValue) {
            weatherWidget.classList.remove('hidden');
            loadWeather();
        } else {
            weatherWidget.classList.add('hidden');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
