const express = require('express');
const path = require('path');
const fs = require('fs');
const mqtt = require('mqtt');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// === Config MQTT SSL ===
const MQTT_HOST = 'mqtts://192.168.1.27';  // mqtts:// pour SSL
const MQTT_PORT = 8883;                     // port standard MQTT SSL
const SHELLY_TOPIC = 'shellyplus1pm-cc7b5c836978/rpc';

// Charger le certificat CA personnalisé
const caFilePath = path.join(__dirname, 'user_ca.pem');  // adapte le chemin si besoin
const caCert = fs.readFileSync(caFilePath);

const mqttClient = mqtt.connect(`${MQTT_HOST}:${MQTT_PORT}`, {
  ca: caCert,
  rejectUnauthorized: true  // vérifie la validité du certificat
});

mqttClient.on('connect', () => {
  console.log('📡 Connecté au broker MQTT avec TLS');
});

mqttClient.on('error', (err) => {
  console.error('❌ Erreur MQTT:', err);
});

// Fonction pour envoyer une commande MQTT au Shelly
function controlShellyRelayMQTT(turnOn = true) {
  const payload = {
    id: Date.now(),
    src: 'my_app',
    method: 'Switch.Set',
    params: {
      id: 0,
      on: turnOn
    }
  };

  return new Promise((resolve, reject) => {
    mqttClient.publish(SHELLY_TOPIC, JSON.stringify(payload), (err) => {
      if (err) {
        return reject(err);
      }
      resolve({ success: true, message: `Commande envoyée : ${turnOn ? 'on' : 'off'}` });
    });
  });
}

// Contrôle simple si une recharge est déjà en cours
let rechargeEnCours = false;

app.post('/api/shelly/on', async (req, res) => {
  const { duree } = req.body;
  const dureeHeures = Number(duree);

  if (![1, 2, 3].includes(dureeHeures)) {
    return res.status(400).json({ success: false, message: 'Durée invalide (1, 2 ou 3 heures)' });
  }

  if (rechargeEnCours) {
    return res.status(429).json({ success: false, message: 'Recharge déjà en cours' });
  }

  try {
    const result = await controlShellyRelayMQTT(true);
    rechargeEnCours = true;
    console.log(`✅ Recharge démarrée pour ${dureeHeures}h via MQTT :`, result);

    const delayMs = dureeHeures * 60 * 60 * 1000;

    setTimeout(async () => {
      try {
        const stopResult = await controlShellyRelayMQTT(false);
        console.log(`⛔ Recharge arrêtée après ${dureeHeures}h :`, stopResult);
      } catch (err) {
        console.error('❌ Erreur arrêt automatique Shelly MQTT:', err);
      } finally {
        rechargeEnCours = false;
      }
    }, delayMs);

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Erreur dans /api/shelly/on:', error);
    rechargeEnCours = false;
    return res.status(500).json({ success: false, message: 'Erreur de communication MQTT' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
