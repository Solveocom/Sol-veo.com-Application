const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// === Config Shelly LAN ===
const SHELLY_IP = "192.168.1.50"; // <-- Mets l’IP locale de ton Shelly
const SHELLY_URL = `http://${SHELLY_IP}/rpc`;

// Fonction pour envoyer une commande en LAN
async function controlShellyRelayLAN(turnOn = true) {
  const url = `${SHELLY_URL}/Switch.Set?id=0&on=${turnOn}`;
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erreur API LAN : ${response.status} - ${text}`);
  }
  return response.json();
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
    const result = await controlShellyRelayLAN(true);
    rechargeEnCours = true;
    console.log(`✅ Recharge démarrée pour ${dureeHeures}h via LAN :`, result);

    const delayMs = dureeHeures * 60 * 60 * 1000;
    setTimeout(async () => {
      try {
        const stopResult = await controlShellyRelayLAN(false);
        console.log(`⛔ Recharge arrêtée après ${dureeHeures}h :`, stopResult);
      } catch (err) {
        console.error("❌ Erreur arrêt automatique LAN:", err);
      } finally {
        rechargeEnCours = false;
      }
    }, delayMs);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Erreur dans /api/shelly/on:", error);
    rechargeEnCours = false;
    return res.status(500).json({ success: false, message: "Erreur de communication LAN" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
