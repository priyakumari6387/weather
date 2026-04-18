const apiKey = config.WEATHER_API_KEY;

let isCelsius = true; //toggle state
let lastWeatherData = null;

function getWeather() {
    const city = document.getElementById("city").value.trim();

    if (city === "") {
        showError("Please enter a city name.");
        return;
    }

    showLoader(true);
    hideResults();
    hideError();

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=5`;

    fetch(url)

        .then(res => res.json())
        .then(data => {
            showLoader(false);

            console.log(data); // 🔥 debug

        .then(res => {
            if (!res.ok) {
                throw new Error("Network error");
            }
            return res.json();
        })
        .then(data => {
            showLoader(false);
 d6b85be6808eebbf4d2214c6a08ecf30bdc35af4
            if (data.error) {
                showError(data.error.message);
                return;
            }
            lastWeatherData = data;
            displayCurrentWeather(data);
            displayForecast(data.forecast.forecastday);

            setDynamicBackground(data); // ✅ FIXED
        })
        .catch(error => {
            console.log(error);
            showLoader(false);

            showError("Error fetching weather");

            showError("Unable to fetch weather data. Check your connection.");
 d6b85be6808eebbf4d2214c6a08ecf30bdc35af4
        });
    
}

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},IN&appid=${apiKey}&units=metric`;

    document.getElementById("current-weather").classList.remove("hidden");
}
setDynamicBackground(data);
function displayForecast(days) {
    const container = document.getElementById("forecast-cards");
    container.innerHTML = "";

      document.getElementById("temp").innerText =
        Math.round(data.main.temp) + " °C";

      document.getElementById("condition").innerText =
        data.weather[0].description;

    })
    .catch(() => {
      alert("City not found");
    });

    document.getElementById("forecast-section").classList.remove("hidden");
}
function toggleUnit() {
    isCelsius = !isCelsius;
    const btn = document.getElementById("unit-toggle");
    btn.textContent = isCelsius ? "Switch to °F" : "Switch to °C";
    if (lastWeatherData){
        displayCurrentWeather(lastWeatherData);
        displayForecast(lastWeatherData.forecast.forecastday);
    }
}

function showLoader(show) {
    document.getElementById("loader").classList.toggle("hidden", !show);
}

function showError(message) {
    const el = document.getElementById("error-msg");
    el.textContent = message;
    el.classList.remove("hidden");
}

function hideError() {
    document.getElementById("error-msg").classList.add("hidden");
}

function hideResults() {
    document.getElementById("current-weather").classList.add("hidden");
    document.getElementById("forecast-section").classList.add("hidden");
}
function setDynamicBackground(data) {
    const condition = data.current.condition.text.toLowerCase();
    const isDay = data.current.is_day;

    let bgImage = "";

    if (condition.includes("rain")) {
        bgImage = "url('https://images.unsplash.com/photo-1501696461415-6bd6660c6742')";
    } 
    else if (condition.includes("cloud")) {
        bgImage = "url('https://images.unsplash.com/photo-1501630834273-4b5604d2ee31')";
    } 
    else if (condition.includes("clear") && isDay) {
        bgImage = "url('https://images.unsplash.com/photo-1502082553048-f009c37129b9')";
    } 
    else if (condition.includes("clear") && !isDay) {
        bgImage = "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee')";
    } 
    else if (!isDay) {
        bgImage = "url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429')";
    } 
    else {
        bgImage = "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e')";
    }

    document.body.style.background = `
        linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)),
        ${bgImage}
    `;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
}
