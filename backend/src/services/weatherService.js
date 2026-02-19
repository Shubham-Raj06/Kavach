const axios = require("axios");

const BASE_URL = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";

async function fetchWeather(lat, lon) {
    const res = await axios.get(`${BASE_URL}/weather`, {
        params: {
            lat,
            lon,
            appid: process.env.OPENWEATHER_API_KEY,
            units: "metric",
        },
        timeout: 10000,
    });

    return {
        temperature: res.data.main.temp,
        humidity: res.data.main.humidity,
        rainfall: res.data.rain?.["1h"] || res.data.rain?.["3h"] || 0,
    };
}

module.exports = { fetchWeather };
