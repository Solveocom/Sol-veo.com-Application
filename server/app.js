const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// === Config Shelly LAN ===
const SHELLY_IP = "192.168.1.27"; // <--- adapte selon ton réseau
const SHELLY_BASE_URL = `http://${SHELLY_IP}`;

// === Variables de contrôle ===
let rechargeEnCours = false;
let rechargeTimer = null;

// === Fonctions pour contrôler le Shelly ===
async function turnOnShelly() {
  const res = await fetch(`${SHELLY_BASE_URL}/relay/0?turn=on`);
  return res.json();
}

async function turnOffShelly() {
  const res = await fetch(`${SHELLY_BASE_URL}/relay/0?turn=off`);
  return res.json();
}

async function toggleShelly() {
  const res = await fetch(`${SHELLY_BASE_URL}/relay/0?turn=toggle`);
  return res.json();
}

async function getShellyStatus() {
  const res = await fetch(`${SHELLY_BASE_URL}/status`);
  return res.json();
}

async function getShellyInfo() {
  const res = await fetch(`${SHELLY_BASE_URL}/shelly`);
  return res.json();
}

// === Routes API ===

// Démarrer la recharge avec durée (1,2,3 heures)
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

    rechargeTimer = setTimeout(async () => {
      try {
        const stopResult = await turnOffShelly();
        console.log(`⛔ Recharge arrêtée automatiquement après ${dureeHeures}h :`, stopResult);
      } catch (err) {
        console.error("❌ Erreur arrêt automatique :", err);
      } finally {
        rechargeEnCours = false;
        rechargeTimer = null;
      }
    }, dureeHeures * 60 * 60 * 1000);

    res.json({ success: true, message: `Recharge démarrée pour ${dureeHeures}h`, data: result });
  } catch (err) {
    console.error("❌ Erreur /api/shelly/on :", err);
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
    console.error("❌ Erreur /api/shelly/off :", err);
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Toggle (test)
app.post("/api/shelly/toggle", async (req, res) => {
  try {
    const result = await toggleShelly();
    res.json({ success: true, message: "État basculé", data: result });
  } catch (err) {
    console.error("❌ Erreur /api/shelly/toggle :", err);
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Statut du relais
app.get("/api/shelly/status", async (req, res) => {
  try {
    const status = await getShellyStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    console.error("❌ Erreur /api/shelly/status :", err);
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Infos appareil
app.get("/api/shelly/info", async (req, res) => {
  try {
    const info = await getShellyInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    console.error("❌ Erreur /api/shelly/info :", err);
    res.status(500).json({ success: false, message: "Erreur communication LAN" });
  }
});

// Page d’accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Lancement du serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
