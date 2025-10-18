import uuid
import qrcode
import base64
from io import BytesIO
import asyncio
import httpx

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, conint

app = FastAPI(title="API Recharge Vélo Solvéo", version="1.0")

# === Config Shelly LAN ===
SHELLY_IP = "192.168.1.27"
SHELLY_URL = f"http://{SHELLY_IP}/rpc/Switch.Set"
API_TOKEN = "Terminal111219"  # Token simple pour l'API

# === Variables de contrôle ===
recharge_en_cours = False
recharge_task = None

# === Modèle de requête ===
class PayRequest(BaseModel):
    duration: conint(ge=1, le=3)  # 1, 2 ou 3 heures

# === Fonction pour contrôler le relais Shelly ===
async def control_shelly(turn_on: bool = True):
    payload = {"id": 0, "on": turn_on}
    async with httpx.AsyncClient() as client:
        response = await client.post(SHELLY_URL, json=payload, timeout=10)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Erreur LAN Shelly : {response.text}")
    return response.json()

# === Middleware simple pour vérifier le token ===
async def check_token(x_api_token: str = Header(...)):
    if x_api_token != API_TOKEN:
        raise HTTPException(status_code=403, detail="Token invalide")

# === Route pour créer un paiement et démarrer la recharge ===
@app.post("/pay")
async def create_payment(data: PayRequest, x_api_token: str = Header(...)):
    global recharge_en_cours, recharge_task

    # Vérification du token
    await check_token(x_api_token)

    if recharge_en_cours:
        raise HTTPException(status_code=429, detail="Recharge déjà en cours")

    # Génération de l'ID de transaction et URL de paiement
    transaction_id = str(uuid.uuid4())
    payment_url = f"https://twint.fakepay.ch/pay/{transaction_id}?duration={data.duration}"

    # Génération du QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(payment_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()

    # Marquer recharge comme en cours
    recharge_en_cours = True

    # Démarrage du relais et timer asynchrone
    async def recharge_timer(duration_hours: int):
        try:
            await control_shelly(True)
            await asyncio.sleep(duration_hours * 3600)  # Conversion heures → secondes
            await control_shelly(False)
        except Exception as e:
            print("Erreur Shelly LAN:", e)
        finally:
            global recharge_en_cours, recharge_task
            recharge_en_cours = False
            recharge_task = None

    recharge_task = asyncio.create_task(recharge_timer(data.duration))

    return {
        "transactionId": transaction_id,
        "paymentUrl": payment_url,
        "qrCodeBase64": qr_base64,
        "message": f"Recharge de {data.duration}h prête à être payée"
    }

# === Route pour vérifier l'état de la recharge ===
@app.get("/status")
async def get_status(x_api_token: str = Header(...)):
    await check_token(x_api_token)
    return {"rechargeEnCours": recharge_en_cours}

# === Route pour arrêter manuellement la recharge (test ou urgence) ===
@app.post("/stop")
async def stop_recharge(x_api_token: str = Header(...)):
    global recharge_en_cours, recharge_task
    await check_token(x_api_token)
    if not recharge_en_cours:
        raise HTTPException(status_code=400, detail="Aucune recharge en cours")
    if recharge_task:
        recharge_task.cancel()
        try:
            await control_shelly(False)
        except Exception as e:
            print("Erreur arrêt manuel Shelly LAN:", e)
        recharge_en_cours = False
        recharge_task = None
    return {"success": True, "message": "Recharge arrêtée manuellement"}
