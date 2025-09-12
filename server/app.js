// server/app.js
const express = require('express');
const path = require('path');
const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Sert les fichiers statiques depuis le dossier public
app.use(express.static(path.join(__dirname, '../public')));

// Route racine qui envoie le bon index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Endpoint API simulé
app.post('/api/shelly/:action', (req, res) => {
  const { action } = req.params;
  const { duree, tarif } = req.body;

  console.log(`Commande reçue : ${action}, Durée : ${duree}h, Tarif : ${tarif} CHF`);

  if (action === 'on' || action === 'off') {
    res.json({
      success: true,
      data: {
        isok: true,
        action,
        duree,
        tarif
      }
    });
  } else {
    res.status(400).json({ success: false, error: 'Action invalide' });
  }
});

// Démarre le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur le port ${PORT}`);
});
