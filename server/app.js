import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

// ⚡ Infos Shelly Cloud
const SHELLY_HOST = "shelly-200-eu.shelly.cloud";
const AUTH_KEY =
  "MzVkM2YzdWlkF9326A8EDA3E3AC73DD19C3FFA4F37B7E28A26EC358E5720E40A128EA243A8DA9E96FDE79B44B21A";
const DEVICE_ID = "cc7b5c836978";

// 👉 Route pour contrôler le Shelly (on/off)
app.post("/api/shelly/:action", async (req, res) => {
  const action = req.params.action; // "on" ou "off"

  if (!["on", "off"].includes(action)) {
    return res.status(400).json({ error: "Action invalide. Utilise on/off." });
  }

  try {
    const url = `https://${SHELLY_HOST}/device/relay/control`;
    const params = new URLSearchParams({
      id: DEVICE_ID,
      auth_key: AUTH_KEY,
      channel: "0",
      turn: action,
    });

    const response = await fetch(url, {
      method: "POST",
      body: params,
    });

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Erreur Shelly:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
