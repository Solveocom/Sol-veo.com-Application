import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ⚡ Variables Cloud Shelly
const HOST = "shelly-200-eu.shelly.cloud";
const DEVICE_ID = "TON_DEVICE_ID"; // Tu dois mettre ton vrai DEVICE_ID ici
const AUTH_KEY = "MzVkM2YzdWlkF9326A8EDA3E3AC73DD19C3FFA4F37B7E28A26EC358E5720E40A128EA243A8DA9E96FDE79B44B21A";

// Servir les fichiers statiques (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, "public")));

// Route pour activer la recharge
app.get("/activer", async (req, res) => {
  try {
    const url = `https://${HOST}/device/relay/control`;
    const params = new URLSearchParams({
      id: DEVICE_ID,
      auth_key: AUTH_KEY,
      channel: "0",
      turn: "on"
    });

    const response = await fetch(url, { method: "POST", body: params });
    const data = await response.json();

    res.json({ success: true, action: "on", data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour désactiver la recharge
app.get("/desactiver", async (req, res) => {
  try {
    const url = `https://${HOST}/device/relay/control`;
    const params = new URLSearchParams({
      id: DEVICE_ID,
      auth_key: AUTH_KEY,
      channel: "0",
      turn: "off"
    });

    const response = await fetch(url, { method: "POST", body: params });
    const data = await response.json();

    res.json({ success: true, action: "off", data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => console.log(`🚲 Serveur lancé sur http://localhost:${PORT}`));
