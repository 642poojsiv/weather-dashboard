const forecastContainer = document.getElementById("forecast");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("description");
const detailsEl = document.getElementById("details");
const locationEl = document.getElementById("location");
const timeEl = document.getElementById("time");

let forecastData = [];
let currentType = "temp";

navigator.geolocation.getCurrentPosition(success, error);

function success(position) {
  const { latitude, longitude } = position.coords;
  fetchWeatherByCoords(latitude, longitude);
}

function error() {
  locationEl.textContent = "Unable to fetch location. Please search a city.";
}

async function fetchWeatherByCoords(lat, lon) {
  await fetchWeatherData(`lat=${lat}&lon=${lon}`);
}

async function fetchWeatherByCity(city) {
  await fetchWeatherData(`q=${encodeURIComponent(city)}`);
}

async function fetchWeatherData(query) {
  try {
    const res = await fetch(`/api/weather?${query}`);
    if (!res.ok) throw new Error("Weather fetch failed");
    const { current, forecast } = await res.json();

    updateCurrentWeather(current);
    forecastData = groupForecastByDay(forecast.list);
    updateForecast();
  } catch (err) {
    console.error(err);
    locationEl.textContent = "Error fetching weather data";
  }
}

function updateCurrentWeather(current) {
  tempEl.textContent = `${Math.round(current.main.temp)}°C`;
  descEl.textContent = current.weather[0].description;
  detailsEl.textContent = `Humidity: ${current.main.humidity}% | Wind: ${current.wind.speed} m/s`;
  locationEl.textContent = `${current.name}, ${current.sys.country}`;
  timeEl.textContent = new Date().toLocaleTimeString();
}

function groupForecastByDay(list) {
  const days = {};
  list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    if (!days[day]) days[day] = { temps: [], winds: [], precips: [], icons: [] };

    days[day].temps.push(item.main.temp);
    days[day].winds.push(item.wind.speed);
    days[day].precips.push(item.pop);
    days[day].icons.push(item.weather[0].icon);
  });

  return Object.entries(days).map(([day, v]) => {
    const icon = v.icons.sort((a, b) =>
      v.icons.filter(x => x === a).length - v.icons.filter(x => x === b).length
    ).pop();

    return {
      day,
      maxTemp: Math.max(...v.temps),
      minTemp: Math.min(...v.temps),
      avgWind: (v.winds.reduce((a, b) => a + b, 0) / v.winds.length).toFixed(1),
      avgPrecip: Math.round((v.precips.reduce((a, b) => a + b, 0) / v.precips.length) * 100),
      icon
    };
  }).slice(0, 5);
}

function updateForecast() {
  forecastContainer.innerHTML = "";
  forecastData.forEach(d => {
    let value = currentType === "temp"
      ? `${Math.round(d.maxTemp)}° / ${Math.round(d.minTemp)}°`
      : currentType === "wind"
      ? `${d.avgWind} m/s`
      : `${d.avgPrecip}%`;

    const div = document.createElement("div");
    div.classList.add("day");
    div.innerHTML = `
      <h4>${d.day}</h4>
      <img src="https://openweathermap.org/img/wn/${d.icon}@2x.png" />
      <p>${value}</p>
    `;
    forecastContainer.appendChild(div);
  });
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelector(".tab.active").classList.remove("active");
    tab.classList.add("active");
    currentType = tab.dataset.type;
    updateForecast();
  });
});

document.getElementById("searchBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value.trim();
  if (city) fetchWeatherByCity(city);
});

document.getElementById("cityInput").addEventListener("keypress", e => {
  if (e.key === "Enter") document.getElementById("searchBtn").click();
});

