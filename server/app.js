const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

// ⚡ Configuration Shelly
const SHELLY_HOST = "https://shelly-200-eu.shelly.cloud";
const AUTH_KEY = "MzVkM2YzdWlkF9326A8EDA3E3AC73DD19C3FFA4F37B7E28A26EC358E5720E40A128EA243A8DA9E96FDE79B44B21A";
const DEVICE_ID = "cc7b5c836978";

// ✅ API pour activer/désactiver le Shelly
app.post("/api/shelly", async (req, res) => {
  const { action } = req.body; // "on" ou "off"

  if (!["on", "off"].includes(action)) {
    return res.status(400).json({ error: "Action invalide" });
  }

  try {
    const response = await fetch(`${SHELLY_HOST}/device/relay/control`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        id: DEVICE_ID,
        auth_key: AUTH_KEY,
        channel: 0,
        turn: action
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("Erreur Shelly:", err);
    res.status(500).json({ error: "Impossible de contacter Shelly" });
  }
});

// 🚀 Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
