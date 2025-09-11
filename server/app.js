// server.js
const express = require('express');
const path = require('path');
const app = express();

// Sert les fichiers statiques (HTML, CSS, JS) depuis la racine
app.use(express.static(path.join(__dirname, '/')));

// Route racine pour renvoyer index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Port défini par Render ou 3000 en local
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur en ligne sur le port ${port}`);
});
