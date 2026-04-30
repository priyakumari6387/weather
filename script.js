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

    const wrapperCard = document.getElementById("weather-wrapper");
    if(wrapperCard) wrapperCard.classList.remove("hidden");

    renderChart(data);
}

let weatherChartInstance = null;

function renderChart(data) {
    const ctx = document.getElementById('weatherChart');
    if(!ctx) return;

    if(weatherChartInstance) {
        weatherChartInstance.destroy();
    }

    // Get hourly forecast for today and tomorrow to ensure we have next 24 hours
    let hours = [];
    if(data.forecast && data.forecast.forecastday) {
        data.forecast.forecastday.forEach(day => {
            hours = hours.concat(day.hour);
        });
    }

    if(hours.length === 0) return;

    // Find current time index to get the next 8 hours for a compact chart
    const currentEpoch = data.location.localtime_epoch;
    let startIndex = hours.findIndex(h => h.time_epoch >= currentEpoch);
    if(startIndex === -1) startIndex = 0;
    
    const nextHours = hours.slice(startIndex, startIndex + 8);
    
    const labels = nextHours.map(h => {
        const time = new Date(h.time_epoch * 1000);
        return time.getHours() + ':00';
    });

    const temps = nextHours.map(h => isCelsius ? Math.round(h.temp_c) : Math.round(h.temp_f));

    weatherChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temp (${isCelsius ? '°C' : '°F'})`,
                data: temps,
                borderColor: '#4dabf7',
                backgroundColor: 'rgba(77, 171, 247, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + (isCelsius ? '°C' : '°F');
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.8)', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.8)', font: { size: 10 } },
                    suggestedMin: Math.min(...temps) - 2,
                    suggestedMax: Math.max(...temps) + 2
                }
            }
        }
    });
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
    const ww = document.getElementById("weather-wrapper");
    if(ww) ww.classList.add("hidden");
    const fs = document.getElementById("forecast-section");
    if(fs) fs.classList.add("hidden");
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(" ");
    if (parts.length < 2) return 0;
    const timeParts = parts[0].split(":");
    let hours = parseInt(timeParts[0]);
    const mins = parseInt(timeParts[1]);
    if (parts[1].toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (parts[1].toUpperCase() === "AM" && hours === 12) hours = 0;
    return hours * 60 + mins;
}

function getCityLocalMinutes(data) {
    const localtime = data?.location?.localtime;
    if (!localtime) return -1;
    const parts = localtime.split(" ");
    if (parts.length < 2) return -1;
    const timeParts = parts[1].split(":");
    return parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
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

    let isSunrise = false;
    let isSunset = false;

    if (data.forecast && data.forecast.forecastday && data.forecast.forecastday.length > 0) {
        const astro = data.forecast.forecastday[0].astro;
        if (astro && astro.sunrise && astro.sunset) {
            const localMinutes = getCityLocalMinutes(data);
            if (localMinutes !== -1) {
                const sunriseMins = timeToMinutes(astro.sunrise);
                const sunsetMins = timeToMinutes(astro.sunset);
                
                // Active sunrise/sunset effect for 45 mins before and after
                if (Math.abs(localMinutes - sunriseMins) <= 45) isSunrise = true;
                else if (Math.abs(localMinutes - sunsetMins) <= 45) isSunset = true;
            }
        }
    }

    if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunder") || condition.includes("shower")) {
        isRaining = true;
        return "videos/rain.mp4";
    }

    isRaining = false;
    if (condition.includes("cloud") || condition.includes("overcast") || condition.includes("mist") || condition.includes("fog") || condition.includes("haze") || condition.includes("snow") || condition.includes("sleet") || condition.includes("blizzard") || condition.includes("ice") || condition.includes("pellet")) {
        return "videos/clouds.mp4";
    }

    if (isSunrise) return "videos/sunrise.mp4";
    if (isSunset) return "videos/sunset.mp4";

    return isDayByLocalTime ? "videos/sunny.mp4" : "videos/night.mp4";
}

function applyFrontTheme(data) {
    const condition = data.current.condition.text.toLowerCase();
    const localHour = getCityLocalHour(data);
    const isDayByLocalTime = localHour !== null ? localHour >= 6 && localHour < 18 : data.current.is_day === 1;

    document.body.classList.remove("theme-day", "theme-night", "theme-rain", "theme-cloud");

    if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunder") || condition.includes("shower")) {
        document.body.classList.add("theme-rain");
        return;
    }

    if (condition.includes("cloud") || condition.includes("overcast") || condition.includes("mist") || condition.includes("fog") || condition.includes("haze") || condition.includes("snow") || condition.includes("sleet") || condition.includes("blizzard") || condition.includes("ice") || condition.includes("pellet")) {
        document.body.classList.add("theme-cloud");
        return;
    }

    let isSunrise = false;
    let isSunset = false;
    
    if (data.forecast && data.forecast.forecastday && data.forecast.forecastday.length > 0) {
        const astro = data.forecast.forecastday[0].astro;
        if (astro && astro.sunrise && astro.sunset) {
            const localMinutes = getCityLocalMinutes(data);
            if (localMinutes !== -1) {
                const sunriseMins = timeToMinutes(astro.sunrise);
                const sunsetMins = timeToMinutes(astro.sunset);
                
                if (Math.abs(localMinutes - sunriseMins) <= 45) isSunrise = true;
                else if (Math.abs(localMinutes - sunsetMins) <= 45) isSunset = true;
            }
        }
    }

    if (isSunrise) {
        document.body.classList.add("theme-day");
        return;
    }
    if (isSunset) {
        document.body.classList.add("theme-night");
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
