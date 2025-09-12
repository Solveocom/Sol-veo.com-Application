const express = require('express');
const path = require('path');
const app = express();

app.use(express.json()); // Pour parser JSON dans les POST

// Servir les fichiers statiques depuis le dossier 'server' (ou 'public' si tu préfères)
app.use(express.static(path.join(__dirname)));

// Route racine pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Exemple simple d'API pour démarrer la recharge
app.post('/api/shelly/on', (req, res) => {
  const { duree, tarif } = req.body;

  console.log(`Démarrage de la recharge pour ${duree}h avec un tarif de ${tarif} CHF`);

  // Ici, place ta logique pour commander ton système Shelly
  // Par exemple appel d'une API, commande réseau, etc.

  // Répond avec succès simulé
  res.json({ success: true, data: { isok: true } });
});

// Port de l’application (Render ou local)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
