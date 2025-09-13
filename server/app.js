const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// === Infos Shelly Cloud ===
const SHELLY_CLOUD_SERVER = 'https://shelly-200-eu.shelly.cloud';
const SHELLY_DEVICE_ID = '224830205159800';
const SHELLY_CLOUD_KEY = 'MzVkM2YzdWlkF9326A8EDA3E3AC73DD19C3FFA4F37B7E28A26EC358E5720E40A128EA243A8DA9E96FDE79B44B21A';

// === Fonction de contrôle Shelly Cloud ===
async function controlShellyRelay(action) {
  const url = `${SHELLY_CLOUD_SERVER}/device/relay/control`;
  const payload = {
    id: SHELLY_DEVICE_ID,
    auth_key: SHELLY_CLOUD_KEY,
    channel: 0,
    turn: action
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Erreur Shelly Cloud: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// === Contrôle de recharge en cours ===
let rechargeEnCours = false;

// === Route POST pour démarrer la recharge ===
app.post('/api/shelly/on', async (req, res) => {
  const { duree } = req.body;
  const dureeHeures = Number(duree);

  if (![1, 2, 3].includes(dureeHeures)) {
    return res.status(400).json({ success: false, message: 'Durée invalide (1, 2 ou 3 heures seulement)' });
  }

  if (rechargeEnCours) {
    return res.status(429).json({ success: false, message: 'Recharge déjà en cours. Veuillez patienter.' });
  }

  try {
    const data = await controlShellyRelay('on');
    rechargeEnCours = true;

    console.log(`✅ Recharge démarrée pour ${dureeHeures}h`);

    const delayMs = dureeHeures * 60 * 60 * 1000;
    setTimeout(async () => {
      try {
        await controlShellyRelay('off');
        console.log(`⛔ Recharge automatiquement arrêtée après ${dureeHeures}h`);
      } catch (err) {
        console.error('❌ Erreur arrêt automatique Shelly:', err);
      } finally {
        rechargeEnCours = false;
      }
    }, delayMs);

    return res.json({ success: true, data });
  } catch (error) {
    rechargeEnCours = false;
    console.error('❌ Erreur Shelly:', error);
    return res.status(500).json({ success: false, message: 'Erreur de communication avec Shelly Cloud' });
  }
});

// === Serveur ===
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
