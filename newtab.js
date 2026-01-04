/**
 * Aura v3.0 - New Tab Script
 * Complete feature set: Wallpapers, Todos, Quotes, Sounds, Links, Weather
 */

// ============================================
// CONSTANTS & CONFIG
// ============================================

const DEFAULT_LINKS = [
    { name: 'Google', url: 'https://google.com' },
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'Gmail', url: 'https://mail.google.com' },
    { name: 'GitHub', url: 'https://github.com' }
];

const SEARCH_ENGINES = {
    google: { name: 'Google', url: 'https://www.google.com/search?q=' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' }
};

const AMBIENT_SOUNDS = {
    rain: 'https://cdn.pixabay.com/audio/2022/05/16/audio_1333dfbc29.mp3',
    coffee: 'https://cdn.pixabay.com/audio/2024/11/13/audio_a84f9950b9.mp3',
    ocean: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3',
    forest: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3',
    fire: 'https://cdn.pixabay.com/audio/2024/06/11/audio_80e53c8c8e.mp3'
};

const WALLPAPER_COLLECTIONS = [
    '1065976', // Nature
    '3330448', // Minimal
    '1111678', // Architecture
    '827743'   // Travel
];

const QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Dream it. Wish it. Do it.", author: "Unknown" },
    { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
    { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Little things make big days.", author: "Unknown" },
    { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" }
];

const WEATHER_ICONS = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌧️', 53: '🌧️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '❄️', 73: '❄️', 75: '❄️',
    77: '❄️', 80: '🌦️', 81: '🌦️', 82: '🌦️',
    85: '🌨️', 86: '🌨️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
};

// ============================================
// STATE
// ============================================

let currentSearchEngine = 'google';
let currentAudio = null;
let currentSound = null;
let particles = [];
let animationFrame = null;

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {};

function cacheElements() {
    // Wallpaper
    elements.wallpaperContainer = document.getElementById('wallpaperContainer');
    elements.wallpaper = document.getElementById('wallpaper');
    elements.wallpaperCredit = document.getElementById('wallpaperCredit');
    elements.photographerName = document.getElementById('photographerName');

    // Time & Search
    elements.time = document.getElementById('time');
    elements.greeting = document.getElementById('greeting');
    elements.searchInput = document.getElementById('searchInput');
    elements.searchEngineToggle = document.getElementById('searchEngineToggle');
    elements.searchEngineName = document.getElementById('searchEngineName');

    // Quote
    elements.quoteText = document.getElementById('quoteText');
    elements.quoteAuthor = document.getElementById('quoteAuthor');

    // Quick Links
    elements.quickLinks = document.getElementById('quickLinks');
    elements.addLinkBtn = document.getElementById('addLinkBtn');
    elements.linkModal = document.getElementById('linkModal');
    elements.linkName = document.getElementById('linkName');
    elements.linkUrl = document.getElementById('linkUrl');
    elements.linkSave = document.getElementById('linkSave');
    elements.linkCancel = document.getElementById('linkCancel');

    // Todos
    elements.todoInput = document.getElementById('todoInput');
    elements.todoList = document.getElementById('todoList');
    elements.todoClearBtn = document.getElementById('todoClearBtn');

    // Weather
    elements.weatherWidget = document.getElementById('weatherWidget');
    elements.weatherLoading = document.getElementById('weatherLoading');
    elements.weatherContent = document.getElementById('weatherContent');
    elements.weatherIcon = document.getElementById('weatherIcon');
    elements.weatherTemp = document.getElementById('weatherTemp');
    elements.weatherLocation = document.getElementById('weatherLocation');

    // Sounds
    elements.soundBtns = document.querySelectorAll('.sound-btn');
    elements.volumeSlider = document.getElementById('volumeSlider');

    // Particles & Focus
    elements.particlesCanvas = document.getElementById('particlesCanvas');
    elements.focusModeBtn = document.getElementById('focusModeBtn');
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    cacheElements();

    // Apply settings
    const settings = await getSettings();

    // Initialize features
    await loadWallpaper(settings);
    updateTime();
    setInterval(updateTime, 1000);
    loadQuote();
    await loadQuickLinks();
    await loadTodos();
    loadWeather(settings);
    initParticles(settings);

    // Setup event listeners
    setupSearch();
    setupQuickLinks();
    setupTodos();
    setupSounds();
    setupFocusMode(settings);

    // Listen for storage changes
    chrome.storage.onChanged.addListener(handleStorageChange);
}

// ============================================
// SETTINGS
// ============================================

async function getSettings() {
    return new Promise(resolve => {
        chrome.storage.sync.get([
            'backgroundColor', 'backgroundGradient', 'backgroundType',
            'showParticles', 'showWeather', 'searchEngine', 'focusMode'
        ], result => resolve({
            bgColor: result.backgroundColor || '#1a1a2e',
            bgGradient: result.backgroundGradient,
            bgType: result.backgroundType || 'wallpaper',
            showParticles: result.showParticles !== false,
            showWeather: result.showWeather !== false,
            searchEngine: result.searchEngine || 'google',
            focusMode: result.focusMode || false
        }));
    });
}

// ============================================
// WALLPAPER
// ============================================

async function loadWallpaper(settings) {
    // Check for cached wallpaper first
    const cached = await getCachedWallpaper();

    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        applyWallpaper(cached);
        return;
    }

    // Use Picsum for CORS-friendly random images
    try {
        // Random seed for variety
        const seed = Math.floor(Math.random() * 1000);
        const url = `https://picsum.photos/seed/${seed}/1920/1080`;

        const wallpaperData = {
            url: url,
            photographer: 'Picsum Photos',
            timestamp: Date.now()
        };

        applyWallpaper(wallpaperData);
        cacheWallpaper(wallpaperData);
    } catch (error) {
        // Fallback to gradient
        applyFallbackBackground(settings);
    }
}

function applyWallpaper(data) {
    if (elements.wallpaper) {
        elements.wallpaper.src = data.url;
        elements.wallpaper.onload = () => {
            elements.wallpaper.classList.add('loaded');
        };
    }
    if (elements.photographerName) {
        elements.photographerName.innerHTML = `Photo by <a href="https://picsum.photos" target="_blank">${data.photographer}</a>`;
    }
}

function applyFallbackBackground(settings) {
    elements.wallpaperContainer.style.display = 'none';
    if (settings.bgType === 'gradient' && settings.bgGradient) {
        document.body.style.background = settings.bgGradient;
    } else {
        document.body.style.background = settings.bgColor;
    }
}

async function getCachedWallpaper() {
    return new Promise(resolve => {
        chrome.storage.local.get(['wallpaperCache'], result => {
            resolve(result.wallpaperCache || null);
        });
    });
}

function cacheWallpaper(data) {
    chrome.storage.local.set({ wallpaperCache: data });
}

// ============================================
// TIME & GREETING
// ============================================

function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    elements.time.textContent = `${hours}:${minutes}`;

    const hour = now.getHours();
    let greeting = 'Good evening';
    if (hour >= 5 && hour < 12) greeting = 'Good morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17 && hour < 21) greeting = 'Good evening';
    else greeting = 'Good night';

    elements.greeting.textContent = greeting;
}

// ============================================
// QUOTES
// ============================================

async function loadQuote() {
    // Check cache
    const cached = await getCachedQuote();
    const today = new Date().toDateString();

    if (cached && cached.date === today) {
        displayQuote(cached.quote);
        return;
    }

    // Get random quote
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    displayQuote(quote);
    cacheQuote(quote, today);
}

function displayQuote(quote) {
    elements.quoteText.textContent = `"${quote.text}"`;
    elements.quoteAuthor.textContent = `— ${quote.author}`;
}

async function getCachedQuote() {
    return new Promise(resolve => {
        chrome.storage.local.get(['quoteCache'], result => {
            resolve(result.quoteCache || null);
        });
    });
}

function cacheQuote(quote, date) {
    chrome.storage.local.set({ quoteCache: { quote, date } });
}

// ============================================
// QUICK LINKS
// ============================================

async function loadQuickLinks() {
    const links = await getLinks();
    renderLinks(links);
}

async function getLinks() {
    return new Promise(resolve => {
        chrome.storage.sync.get(['quickLinks'], result => {
            resolve(result.quickLinks || DEFAULT_LINKS);
        });
    });
}

function renderLinks(links) {
    elements.quickLinks.innerHTML = '';

    links.forEach((link, index) => {
        const el = document.createElement('a');
        el.href = link.url;
        el.className = 'quick-link';
        el.style.position = 'relative';

        const domain = new URL(link.url).hostname;
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        el.innerHTML = `
            <div class="quick-link-icon">
                <img src="${favicon}" alt="${link.name}" onerror="this.style.display='none'">
            </div>
            <span class="quick-link-name">${link.name}</span>
            <button class="delete-link" data-index="${index}">×</button>
        `;

        elements.quickLinks.appendChild(el);
    });

    // Delete button handlers
    document.querySelectorAll('.delete-link').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const links = await getLinks();
            links.splice(index, 1);
            await chrome.storage.sync.set({ quickLinks: links });
            renderLinks(links);
        };
    });
}

function setupQuickLinks() {
    elements.addLinkBtn.onclick = () => {
        elements.linkModal.classList.add('active');
        elements.linkName.value = '';
        elements.linkUrl.value = '';
        elements.linkName.focus();
    };

    elements.linkCancel.onclick = () => {
        elements.linkModal.classList.remove('active');
    };

    elements.linkSave.onclick = async () => {
        const name = elements.linkName.value.trim();
        let url = elements.linkUrl.value.trim();

        if (!name || !url) return;

        if (!url.startsWith('http')) url = 'https://' + url;

        try {
            new URL(url); // Validate URL
        } catch {
            return;
        }

        const links = await getLinks();
        links.push({ name, url });
        await chrome.storage.sync.set({ quickLinks: links });
        renderLinks(links);
        elements.linkModal.classList.remove('active');
    };

    // Close modal on overlay click
    elements.linkModal.onclick = (e) => {
        if (e.target === elements.linkModal) {
            elements.linkModal.classList.remove('active');
        }
    };
}

// ============================================
// SEARCH
// ============================================

function setupSearch() {
    currentSearchEngine = 'google';

    elements.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && elements.searchInput.value.trim()) {
            const query = encodeURIComponent(elements.searchInput.value.trim());
            window.location.href = SEARCH_ENGINES[currentSearchEngine].url + query;
        }
    });

    elements.searchEngineToggle.onclick = () => {
        const engines = Object.keys(SEARCH_ENGINES);
        const idx = engines.indexOf(currentSearchEngine);
        currentSearchEngine = engines[(idx + 1) % engines.length];
        elements.searchEngineName.textContent = SEARCH_ENGINES[currentSearchEngine].name;
    };

    setTimeout(() => elements.searchInput.focus(), 500);
}

// ============================================
// TODOS
// ============================================

async function loadTodos() {
    const todos = await getTodos();
    renderTodos(todos);
}

async function getTodos() {
    return new Promise(resolve => {
        chrome.storage.sync.get(['todos'], result => {
            resolve(result.todos || []);
        });
    });
}

function renderTodos(todos) {
    elements.todoList.innerHTML = '';

    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
            <span>${todo.text}</span>
            <button class="delete-todo" data-index="${index}">×</button>
        `;
        elements.todoList.appendChild(li);
    });

    // Checkbox handlers
    elements.todoList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.onchange = async () => {
            const todos = await getTodos();
            const idx = parseInt(cb.dataset.index);
            todos[idx].completed = cb.checked;
            await chrome.storage.sync.set({ todos });
            renderTodos(todos);
        };
    });

    // Delete handlers
    elements.todoList.querySelectorAll('.delete-todo').forEach(btn => {
        btn.onclick = async () => {
            const todos = await getTodos();
            const idx = parseInt(btn.dataset.index);
            todos.splice(idx, 1);
            await chrome.storage.sync.set({ todos });
            renderTodos(todos);
        };
    });
}

function setupTodos() {
    elements.todoInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && elements.todoInput.value.trim()) {
            const todos = await getTodos();
            todos.push({ text: elements.todoInput.value.trim(), completed: false });
            await chrome.storage.sync.set({ todos });
            elements.todoInput.value = '';
            renderTodos(todos);
        }
    });

    elements.todoClearBtn.onclick = async () => {
        const todos = await getTodos();
        const remaining = todos.filter(t => !t.completed);
        await chrome.storage.sync.set({ todos: remaining });
        renderTodos(remaining);
    };
}

// ============================================
// WEATHER
// ============================================

async function loadWeather(settings) {
    if (!settings.showWeather) {
        elements.weatherWidget.classList.add('hidden');
        return;
    }

    // Check cache
    const cached = await getCachedWeather();
    if (cached && Date.now() - cached.timestamp < 1800000) { // 30 min cache
        displayWeather(cached);
        return;
    }

    try {
        const locRes = await fetch('https://ipapi.co/json/');
        const locData = await locRes.json();

        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current=temperature_2m,weather_code&timezone=auto`
        );
        const weatherData = await weatherRes.json();

        const weather = {
            temp: Math.round(weatherData.current.temperature_2m),
            code: weatherData.current.weather_code,
            location: locData.city,
            timestamp: Date.now()
        };

        displayWeather(weather);
        cacheWeather(weather);
    } catch {
        elements.weatherWidget.classList.add('hidden');
    }
}

function displayWeather(weather) {
    elements.weatherLoading.style.display = 'none';
    elements.weatherContent.style.display = 'flex';
    elements.weatherIcon.textContent = WEATHER_ICONS[weather.code] || '🌡️';
    elements.weatherTemp.textContent = `${weather.temp}°C`;
    elements.weatherLocation.textContent = weather.location;
}

async function getCachedWeather() {
    return new Promise(resolve => {
        chrome.storage.local.get(['weatherCache'], result => {
            resolve(result.weatherCache || null);
        });
    });
}

function cacheWeather(data) {
    chrome.storage.local.set({ weatherCache: data });
}

// ============================================
// AMBIENT SOUNDS
// ============================================

function setupSounds() {
    elements.soundBtns.forEach(btn => {
        btn.onclick = () => {
            const sound = btn.dataset.sound;

            if (currentSound === sound) {
                // Stop current sound
                stopSound();
                btn.classList.remove('active');
                currentSound = null;
            } else {
                // Play new sound
                stopSound();
                elements.soundBtns.forEach(b => b.classList.remove('active'));
                playSound(sound);
                btn.classList.add('active');
                currentSound = sound;
            }
        };
    });

    elements.volumeSlider.oninput = () => {
        if (currentAudio) {
            currentAudio.volume = elements.volumeSlider.value / 100;
        }
    };
}

function playSound(sound) {
    const url = AMBIENT_SOUNDS[sound];
    if (!url) return;

    currentAudio = new Audio(url);
    currentAudio.loop = true;
    currentAudio.volume = elements.volumeSlider.value / 100;
    currentAudio.play().catch(() => { });
}

function stopSound() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

// ============================================
// PARTICLES
// ============================================

function initParticles(settings) {
    if (!settings.showParticles) return;

    const canvas = elements.particlesCanvas;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(40, Math.floor(window.innerWidth / 40));
    particles = [];

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.4 + 0.1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
        });

        // Draw connections
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 * (1 - dist / 100)})`;
                    ctx.stroke();
                }
            });
        });

        animationFrame = requestAnimationFrame(animate);
    }

    canvas.classList.add('active');
    animate();
}

// ============================================
// FOCUS MODE
// ============================================

function setupFocusMode(settings) {
    if (settings.focusMode) {
        document.body.classList.add('focus-mode');
        elements.focusModeBtn.classList.add('active');
    }

    elements.focusModeBtn.onclick = () => {
        document.body.classList.toggle('focus-mode');
        elements.focusModeBtn.classList.toggle('active');
        const isFocus = document.body.classList.contains('focus-mode');
        chrome.storage.sync.set({ focusMode: isFocus });
    };
}

// ============================================
// STORAGE CHANGE HANDLER
// ============================================

function handleStorageChange(changes, area) {
    if (area !== 'sync') return;

    if (changes.backgroundColor || changes.backgroundGradient || changes.backgroundType) {
        location.reload();
    }

    if (changes.showParticles) {
        if (changes.showParticles.newValue) {
            getSettings().then(initParticles);
        } else {
            if (animationFrame) cancelAnimationFrame(animationFrame);
            elements.particlesCanvas.classList.remove('active');
        }
    }

    if (changes.showWeather) {
        if (changes.showWeather.newValue) {
            elements.weatherWidget.classList.remove('hidden');
            getSettings().then(loadWeather);
        } else {
            elements.weatherWidget.classList.add('hidden');
        }
    }
}

// ============================================
// START
// ============================================

document.addEventListener('DOMContentLoaded', init);
