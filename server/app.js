const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// === Config Shelly LAN ===
const SHELLY_IP = "192.168.1.27";   // <-- à adapter avec l’IP de ton Shelly
const SHELLY_URL = `http://${SHELLY_IP}/rpc`;

// === Variables de contrôle ===
let rechargeEnCours = false;
let rechargeTimer = null;

// === Fonction utilitaire Fetch vers Shelly ===
async function shellyRequest(method, params = {}) {
  const url = `${SHELLY_URL}/${method}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erreur API LAN : ${response.status} - ${text}`);
  }
  return response.json();
}

// === Contrôle basique ===
async function turnOnShelly() {
  return shellyRequest("Switch.Set", { id: 0, on: true });
}
async function turnOffShelly() {
  return shellyRequest("Switch.Set", { id: 0, on: false });
}
async function toggleShelly() {
  return shellyRequest("Switch.Toggle", { id: 0 });
}
async function getShellyStatus() {
  return shellyRequest("Switch.GetStatus", { id: 0 });
}
async function getShellyInfo() {
  return shellyRequest("Shelly.GetDeviceInfo");
}

// === Routes API ===

// Démarrer une recharge avec durée (1,2,3h)
app.post("/api/shelly/on", async (req, res) => {
  const { duree } = req.body;
  const dureeHeures = Number(duree);

  if (!Number.isInteger(dureeHeures) || ![1, 2, 3].includes(dureeHeures)) {
    return res.status(400).json({ success: false, message: "Durée invalide (1, 2 ou 3 heures)" });
  }
  if (rechargeEnCours) {
    return res.status(429).json({ success: false, message: "Recharge déjà en cours" });
  }

  try {
    const result = await turnOnShelly();
    rechargeEnCours = true;
    console.log(`✅ Recharge démarrée pour ${dureeHeures}h :`, result);

    const delayMs = dureeHeures * 60 * 60 * 1000;
    rechargeTimer = setTimeout(async () => {
      try {
        const stopResult = await turnOffShelly();
        console.log(`⛔ Recharge arrêtée après ${dureeHeures}h :`, stopResult);
      } catch (err) {
        console.error("❌ Erreur arrêt auto LAN:", err);
      } finally {
        rechargeEnCours = false;
        rechargeTimer = null;
      }
    }, delayMs);

    res.json({ success: true, message: `Recharge démarrée pour ${dureeHeures}h`, data: result });
  } catch (error) {
    console.error("❌ Erreur dans /api/shelly/on:", error);
    rechargeEnCours = false;
    rechargeTimer = null;
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Arrêt manuel
app.post("/api/shelly/off", async (req, res) => {
  if (!rechargeEnCours) {
    return res.status(400).json({ success: false, message: "Aucune recharge en cours" });
  }
  try {
    if (rechargeTimer) clearTimeout(rechargeTimer);
    const stopResult = await turnOffShelly();
    rechargeEnCours = false;
    rechargeTimer = null;
    console.log("⛔ Recharge arrêtée manuellement :", stopResult);
    res.json({ success: true, message: "Recharge arrêtée", data: stopResult });
  } catch (err) {
    console.error("❌ Erreur arrêt manuel LAN:", err);
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Toggle (pratique pour test)
app.post("/api/shelly/toggle", async (req, res) => {
  try {
    const result = await toggleShelly();
    res.json({ success: true, message: "État basculé", data: result });
  } catch (err) {
    console.error("❌ Erreur toggle:", err);
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Statut relais
app.get("/api/shelly/status", async (req, res) => {
  try {
    const status = await getShellyStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    console.error("❌ Erreur statut:", err);
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Infos appareil
app.get("/api/shelly/info", async (req, res) => {
  try {
    const info = await getShellyInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    console.error("❌ Erreur info:", err);
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Page d’accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
