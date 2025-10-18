const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// === Config Shelly LAN ===
const SHELLY_IP = "192.168.1.27";
const SHELLY_URL = `http://${SHELLY_IP}/rpc/Switch.Set`;
const API_TOKEN = "Terminal111219"; // Protection simple pour l'API

// === Variables de contrôle ===
let rechargeEnCours = false;
let rechargeTimer = null;

// Fonction pour envoyer une commande en LAN
async function controlShellyRelayLAN(turnOn = true) {
  const body = { id: 0, on: turnOn };

  const response = await fetch(SHELLY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erreur API LAN : ${response.status} - ${text}`);
  }

  return response.json();
}

// Middleware simple pour vérifier le token
function checkToken(req, res, next) {
  const token = req.headers["x-api-token"];
  if (token !== API_TOKEN) {
    return res.status(403).json({ success: false, message: "Token invalide" });
  }
  next();
}

// Route d'allumage du relais
app.post("/api/shelly/on", checkToken, async (req, res) => {
  const { duree } = req.body;
  const dureeHeures = Number(duree);

  if (!Number.isInteger(dureeHeures) || ![1, 2, 3].includes(dureeHeures)) {
    return res.status(400).json({ success: false, message: "Durée invalide (1, 2 ou 3 heures)" });
  }

  if (rechargeEnCours) {
    return res.status(429).json({ success: false, message: "Recharge déjà en cours" });
  }

  try {
    const result = await controlShellyRelayLAN(true);
    rechargeEnCours = true;
    console.log(`✅ Recharge démarrée pour ${dureeHeures}h :`, result);

    const delayMs = dureeHeures * 60 * 60 * 1000;

    // On stocke le timer pour pouvoir le gérer si besoin
    rechargeTimer = setTimeout(async () => {
      try {
        const stopResult = await controlShellyRelayLAN(false);
        console.log(`⛔ Recharge arrêtée après ${dureeHeures}h :`, stopResult);
      } catch (err) {
        console.error("❌ Erreur arrêt automatique LAN:", err);
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
    res.status(500).json({ success: false, message: "Erreur de communication LAN" });
  }
});

// Route d'arrêt manuel
app.post("/api/shelly/off", checkToken, async (req, res) => {
  if (!rechargeEnCours) {
    return res.status(400).json({ success: false, message: "Aucune recharge en cours" });
  }

  try {
    if (rechargeTimer) clearTimeout(rechargeTimer);
    const stopResult = await controlShellyRelayLAN(false);
    rechargeEnCours = false;
    rechargeTimer = null;
    console.log("⛔ Recharge arrêtée manuellement :", stopResult);
    res.json({ success: true, message: "Recharge arrêtée", data: stopResult });
  } catch (err) {
    console.error("❌ Erreur arrêt manuel LAN:", err);
    res.status(500).json({ success: false, message: "Erreur de communication LAN" });
  }
});

// Route principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
