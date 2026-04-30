const apiKey = typeof config !== 'undefined' && config.WEATHER_API_KEY ? config.WEATHER_API_KEY : "f0133e94263d448c963164120261904";
let isRaining = false;
let isCelsius = true;
let lastWeatherData = null;
let activeVideoIndex = 0;
let currentBackgroundFile = "videos/clear.mp4";

const bgVideos = [
    document.getElementById("bgVideoA"),
    document.getElementById("bgVideoB")
];

const canvasFX = document.getElementById("effectsCanvas");
const ctxFX = canvasFX ? canvasFX.getContext("2d") : null;
let rainDrops = [];

function getWeather() {
    const cityInput = document.getElementById("city");
    if (!cityInput) return;
    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    showLoader(true);
    hideResults();
    hideError();

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=5`;

    fetch(url)
        .then((res) => {
            if (!res.ok) {
                throw new Error("Network error");
            }
            return res.json();
        })
        .then((data) => {
            showLoader(false);

            if (data.error) {
                showError(data.error.message);
                return;
            }

            lastWeatherData = data;
            displayCurrentWeather(data);
            displayForecast(data.forecast.forecastday);
            setDynamicBackground(data);
        })
        .catch(() => {
            showLoader(false);
            showError("Unable to fetch weather data.");
        });
}

function displayCurrentWeather(data) {
    const { current, location } = data;
    const temp = isCelsius ? current.temp_c : current.temp_f;
    const feels = isCelsius ? current.feelslike_c : current.feelslike_f;
    const wind = isCelsius ? `${current.wind_kph} km/h` : `${current.wind_mph} mph`;

    const elCityName = document.getElementById("city-name");
    if(elCityName) elCityName.textContent = `${location.name}, ${location.country}`;
    
    const elCondition = document.getElementById("weather-condition");
    if(elCondition) elCondition.textContent = current.condition.text;
    
    const elIcon = document.getElementById("weather-icon");
    if(elIcon) elIcon.src = `https:${current.condition.icon}`;
    
    const elTemp = document.getElementById("temp");
    if(elTemp) elTemp.textContent = `${Math.round(temp)}°${isCelsius ? "C" : "F"}`;
    
    const elFeels = document.getElementById("feels-like");
    if(elFeels) elFeels.textContent = `${Math.round(feels)}°${isCelsius ? "C" : "F"}`;
    
    const elHumidity = document.getElementById("humidity");
    if(elHumidity) elHumidity.textContent = `${current.humidity}%`;
    
    const elWind = document.getElementById("wind");
    if(elWind) elWind.textContent = wind;
    
    const elWindDir = document.getElementById("wind-dir");
    if(elWindDir) elWindDir.textContent = current.wind_dir;

    const currentCard = document.getElementById("current-weather");
    if(currentCard) currentCard.classList.remove("hidden");
}

function displayForecast(days) {
    const container = document.getElementById("forecast-cards");
    if(!container) return;
    container.innerHTML = "";

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    days.forEach((day) => {
        const date = new Date(`${day.date}T00:00:00`);
        const dayName = dayNames[date.getDay()];
        const dateStr = `${date.getDate()} ${date.toLocaleString("default", { month: "short" })}`;
        const maxTemp = isCelsius ? day.day.maxtemp_c : day.day.maxtemp_f;
        const minTemp = isCelsius ? day.day.mintemp_c : day.day.mintemp_f;

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <div class="forecast-day">${dayName}, ${dateStr}</div>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
            <div class="forecast-high">${Math.round(maxTemp)}°</div>
            <div class="forecast-low">${Math.round(minTemp)}°</div>
            <div class="forecast-condition">${day.day.condition.text}</div>
        `;
        container.appendChild(card);
    });

    const forecastSection = document.getElementById("forecast-section");
    if(forecastSection) forecastSection.classList.remove("hidden");
}

function updateWeather(data){
    // This is a fallback function for geolocation
    const { current, location } = data;
    const temp = isCelsius ? current.temp_c : current.temp_f;
    
    const elName = document.getElementById("city-name") || document.getElementById("name");
    if(elName) elName.textContent = location.name + ", " + location.country;
    
    const elTemp = document.getElementById("temp");
    if(elTemp) elTemp.textContent = Math.round(temp) + " °C";
    
    const elCondition = document.getElementById("weather-condition") || document.getElementById("condition");
    if(elCondition) elCondition.textContent = current.condition.text;
    
    const elIcon = document.getElementById("weather-icon") || document.getElementById("icon");
    if(elIcon) elIcon.src = "https:" + current.condition.icon;
}

const cityInput = document.getElementById("city");
if(cityInput) {
    cityInput.addEventListener("keypress", function(e){
        if(e.key === "Enter"){
            getWeather();
        }
    });
}

if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position){
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if(!data.error) {
                    lastWeatherData = data;
                    displayCurrentWeather(data);
                    displayForecast(data.forecast.forecastday);
                    setDynamicBackground(data);
                }
            });
    }, function() {
        console.warn("Geolocation denied or unavailable.");
    });
}

function toggleUnit() {
    isCelsius = !isCelsius;
    const toggleBtn = document.getElementById("unit-toggle");
    if(toggleBtn) toggleBtn.textContent = isCelsius ? "Switch to °F" : "Switch to °C";

    if (lastWeatherData) {
        displayCurrentWeather(lastWeatherData);
        displayForecast(lastWeatherData.forecast.forecastday);
    }
}

function showLoader(show) {
    const el = document.getElementById("loader");
    if(el) el.classList.toggle("hidden", !show);
}

function showError(message) {
    const el = document.getElementById("error-msg");
    if(!el) return;
    el.textContent = message;
    el.classList.remove("hidden");
}

function hideError() {
    const el = document.getElementById("error-msg");
    if(el) el.classList.add("hidden");
}

function hideResults() {
    const cw = document.getElementById("current-weather");
    if(cw) cw.classList.add("hidden");
    const fs = document.getElementById("forecast-section");
    if(fs) fs.classList.add("hidden");
}

function getCityLocalHour(data) {
    const localtime = data?.location?.localtime;
    if (!localtime) return null;
    const parts = localtime.split(" ");
    if (parts.length < 2) return null;
    const hour = Number(parts[1].split(":")[0]);
    return Number.isNaN(hour) ? null : hour;
}

function getBackgroundFile(data) {
    const condition = data.current.condition.text.toLowerCase();
    const localHour = getCityLocalHour(data);
    const isDayByLocalTime = localHour !== null ? localHour >= 6 && localHour < 18 : data.current.is_day === 1;

    if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunder")) {
        isRaining = true;
        return "videos/rain.mp4";
    }

    isRaining = false;
    if (condition.includes("cloud") || condition.includes("overcast") || condition.includes("mist")) {
        return "videos/clouds.mp4";
    }

    return isDayByLocalTime ? "videos/clear.mp4" : "videos/night.mp4";
}

function applyFrontTheme(data) {
    const condition = data.current.condition.text.toLowerCase();
    const localHour = getCityLocalHour(data);
    const isDayByLocalTime = localHour !== null ? localHour >= 6 && localHour < 18 : data.current.is_day === 1;

    document.body.classList.remove("theme-day", "theme-night", "theme-rain", "theme-cloud");

    if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunder")) {
        document.body.classList.add("theme-rain");
        return;
    }

    if (condition.includes("cloud") || condition.includes("overcast") || condition.includes("mist")) {
        document.body.classList.add("theme-cloud");
        return;
    }

    document.body.classList.add(isDayByLocalTime ? "theme-day" : "theme-night");
}

function setDynamicBackground(data) {
    applyFrontTheme(data);

    const nextFile = getBackgroundFile(data);
    if (nextFile === currentBackgroundFile) return;

    if (!bgVideos[0] || !bgVideos[1]) return;

    const currentVideo = bgVideos[activeVideoIndex];
    const nextVideo = bgVideos[1 - activeVideoIndex];

    nextVideo.src = nextFile;
    nextVideo.load();
    nextVideo.play().catch(() => {});

    nextVideo.classList.add("active");
    currentVideo.classList.remove("active");

    activeVideoIndex = 1 - activeVideoIndex;
    currentBackgroundFile = nextFile;
}

class RainDrop {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        if(!canvasFX) return;
        this.x = Math.random() * canvasFX.width;
        this.y = initial ? Math.random() * canvasFX.height : -20;
        this.length = Math.random() * 20 + 10;
        this.speed = Math.random() * 7 + 8;
    }

    update() {
        if(!canvasFX) return;
        this.y += this.speed;
        if (this.y > canvasFX.height) {
            this.reset();
        }
    }

    draw() {
        if(!ctxFX) return;
        ctxFX.strokeStyle = "rgba(255,255,255,0.35)";
        ctxFX.lineWidth = 1.2;
        ctxFX.beginPath();
        ctxFX.moveTo(this.x, this.y);
        ctxFX.lineTo(this.x - 2, this.y + this.length);
        ctxFX.stroke();
    }
}

function initRain() {
    if(canvasFX) {
        rainDrops = Array.from({ length: 170 }, () => new RainDrop());
    }
}

function animateEffects() {
    if(!ctxFX || !canvasFX) return;
    ctxFX.clearRect(0, 0, canvasFX.width, canvasFX.height);

    if (isRaining) {
        rainDrops.forEach((drop) => {
            drop.update();
            drop.draw();
        });
    }
    requestAnimationFrame(animateEffects);
}

function resizeEffects() {
    if(!canvasFX) return;
    canvasFX.width = window.innerWidth;
    canvasFX.height = window.innerHeight;
}

if(canvasFX) {
    resizeEffects();
    initRain();
    animateEffects();
    window.addEventListener("resize", resizeEffects);
}

bgVideos.forEach((video) => {
    if(video) {
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.play().catch(() => {});
    }
});
