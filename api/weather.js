// api/weather.js
export default async function handler(req, res) {
  try {
    const { q, lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API key on server" });
    }

    let query = "";
    if (q) query = `q=${encodeURIComponent(q)}`;
    else if (lat && lon) query = `lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    else return res.status(400).json({ error: "Provide q (city) OR lat & lon" });

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${query}&units=metric&appid=${API_KEY}`;

    const [r1, r2] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
    const current = await r1.json();
    const forecast = await r2.json();

    return res.status(200).json({ current, forecast });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
