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
const SHELLY_DEVICE_ID = '224830205159800';  // Identifiant du dispositif
const SHELLY_CLOUD_KEY = 'MzVkM2YzdWlkF9326A8EDA3E3AC73DD19C3FFA4F37B7E28A26EC358E5720E40A128EA243A8DA9E96FDE79B44B21A';

app.post('/api/shelly/:action', async (req, res) => {
  const { action } = req.params;

  if (!['on', 'off'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action invalide' });
  }

  try {
    const turn = action === 'on' ? 'on' : 'off';
    const url = `${SHELLY_CLOUD_SERVER}/device/${SHELLY_DEVICE_ID}/relay/0?turn=${turn}&auth_key=${SHELLY_CLOUD_KEY}`;

    const shellyRes = await fetch(url, { method: 'POST' });

    if (!shellyRes.ok) {
      throw new Error(`Erreur Shelly Cloud: ${shellyRes.status} ${shellyRes.statusText}`);
    }

    const data = await shellyRes.json();

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Erreur Shelly:', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la communication avec Shelly Cloud' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
