import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Données Shelly (à stocker dans les variables d’environnement Render !)
const SHELLY_HOST = process.env.SHELLY_HOST;       // ex: "shelly-48-eu.shelly.cloud"
const SHELLY_DEVICE_ID = process.env.SHELLY_DEVICE_ID;
const SHELLY_AUTH_KEY = process.env.SHELLY_AUTH_KEY;

app.get("/on", async (req, res) => {
  const url = `https://${SHELLY_HOST}/device/relay/control`;
  const body = `id=${SHELLY_DEVICE_ID}&auth_key=${SHELLY_AUTH_KEY}&channel=0&turn=on`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const result = await response.json();
  res.json(result);
});

app.get("/off", async (req, res) => {
  const url = `https://${SHELLY_HOST}/device/relay/control`;
  const body = `id=${SHELLY_DEVICE_ID}&auth_key=${SHELLY_AUTH_KEY}&channel=0&turn=off`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const result = await response.json();
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
