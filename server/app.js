const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// === Config Shelly Cloud ===
const SHELLY_CLOUD_URL = "https://shelly-200-eu.shelly.cloud/rpc";
const DEVICE_ID = "cc7b5c836978";   // ⚡ Mets ici ton Device ID
const AUTH_KEY  = "MzVkM2YzdWlkF9326A8EDA3E3AC73DD19C3FFA4F37B7E28A26EC358E5720E40A128EA243A8DA9E96FDE79B44B21A"; // ⚡ Ta clé API

// Fonction pour envoyer une commande au Cloud
async function controlShellyRelayCloud(turnOn = true) {
  const payload = {
    id: DEVICE_ID,
    auth_key: AUTH_KEY,
    method: "Switch.Set",
    params: { id: 0, on: turnOn }  // id du relai (0 pour le 1er)
  };

  const response = await fetch(SHELLY_CLOUD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await response.text(); // Pour voir le retour complet
  if (!response.ok) throw new Error(`Erreur API Cloud : ${response.status} - ${text}`);
  
  return JSON.parse(text);
}

let rechargeEnCours = false;

app.post("/api/shelly/on", async (req, res) => {
  const { duree } = req.body;
  const dureeHeures = Number(duree);

  if (![1, 2, 3].includes(dureeHeures)) {
    return res.status(400).json({ success: false, message: "Durée invalide (1, 2 ou 3 heures)" });
  }

  if (rechargeEnCours) {
    return res.status(429).json({ success: false, message: "Recharge déjà en cours" });
  }

  try {
    const result = await controlShellyRelayCloud(true);
    rechargeEnCours = true;
    console.log(`✅ Recharge démarrée pour ${dureeHeures}h via Cloud :`, result);

    const delayMs = dureeHeures * 60 * 60 * 1000;
    setTimeout(async () => {
      try {
        const stopResult = await controlShellyRelayCloud(false);
        console.log(`⛔ Recharge arrêtée après ${dureeHeures}h :`, stopResult);
      } catch (err) {
        console.error("❌ Erreur arrêt automatique Cloud:", err);
      } finally {
        rechargeEnCours = false;
      }
    }, delayMs);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Erreur dans /api/shelly/on:", error);
    rechargeEnCours = false;
    return res.status(500).json({ success: false, message: "Erreur de communication Cloud" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
