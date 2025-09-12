const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Infos Shelly Cloud
const SHELLY_CLOUD_SERVER = 'https://shelly-200-eu.shelly.cloud';
const SHELLY_DEVICE_ID = '224830205159800';
const SHELLY_CLOUD_KEY = 'MzVkM2YzdWlkF9326A8EDA3E3AC73DD19C3FFA4F37B7E28A26EC358E5720E40A128EA243A8DA9E96FDE79B44B21A';

// Fonction pour allumer/éteindre le relais Shelly
async function controlShellyRelay(action) {
  const url = `${SHELLY_CLOUD_SERVER}/device/${SHELLY_DEVICE_ID}/relay/0?turn=${action}&auth_key=${SHELLY_CLOUD_KEY}`;
  const response = await fetch(url, { method: 'POST' });

  if (!response.ok) {
    throw new Error(`Erreur Shelly Cloud: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Route API
app.post('/api/shelly/:action', async (req, res) => {
  const { action } = req.params;
  const { duree } = req.body; // durée en heures (1, 2, 3)

  if (action !== 'on') {
    return res.status(400).json({ success: false, message: 'Seule l\'action "on" est autorisée via cette API' });
  }

  if (![1, 2, 3].includes(Number(duree))) {
    return res.status(400).json({ success: false, message: 'Durée invalide (doit être 1, 2 ou 3 heures)' });
  }

  try {
    // Allume le relais
    const data = await controlShellyRelay('on');
    console.log(`✅ Recharge démarrée pour ${duree}h`);

    // Planifie l'arrêt automatique
    const delayMs = Number(duree) * 60 * 60 * 1000; // X heures -> millisecondes
    setTimeout(() => {
      controlShellyRelay('off')
        .then(() => console.log(`⛔ Recharge automatiquement arrêtée après ${duree}h`))
        .catch((err) => console.error('❌ Erreur arrêt automatique Shelly:', err));
    }, delayMs);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur Shelly:', error);
    return res.status(500).json({ success: false, message: 'Erreur de communication avec Shelly Cloud' });
  }
});

// Démarre le serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
