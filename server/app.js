const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/pay', (req, res) => {
    const { duration } = req.body;

    const qrCodeUrl = "https://via.placeholder.com/200x200?text=QR+TWINT";

    setTimeout(() => {
        console.log(`Paiement reçu pour ${duration} minutes`);
        startCharging(duration);
    }, 10000); // Simule paiement après 10 secondes

    res.json({ qrCodeUrl });
});

function startCharging(duration) {
    console.log(`⚡ Prise activée pour ${duration} minutes`);
    setTimeout(() => {
        console.log('⛔ Prise désactivée');
    }, duration * 60 * 1000);
}

app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
