const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// Endpoint pour activer la recharge
app.post('/activate', async (req, res) => {
    const { duration } = req.body; // durée en minutes
    console.log(`🔹 Activation demandée pour ${duration} minutes`);

    const shellyUrlOn = 'http://192.168.1.27/rpc/Switch.Set?id=0&on=true';
    const shellyUrlOff = 'http://192.168.1.27/rpc/Switch.Set?id=0&on=false';

    try {
        // Activation Shelly
        const response = await fetch(shellyUrlOn);
        if (!response.ok) throw new Error("Erreur activation Shelly");
        const data = await response.json();
        console.log("⚡ Shelly activé :", data);

        // Démarrer timer pour désactivation
        setTimeout(async () => {
            try {
                const resOff = await fetch(shellyUrlOff);
                if (!resOff.ok) throw new Error("Erreur désactivation Shelly");
                const dataOff = await resOff.json();
                console.log("⛔ Shelly désactivé :", dataOff);
            } catch (err) {
                console.error(err.message);
            }
        }, duration * 60 * 1000);

        res.json({ success: true, message: `Recharge activée pour ${duration} minutes` });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
