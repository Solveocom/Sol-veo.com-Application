import asyncio
import httpx
from fastapi import FastAPI, HTTPException, Header

app = FastAPI(title="API Shelly Vélo", version="1.0")

# === Config Shelly LAN ===
SHELLY_IP = "192.168.1.27"
SHELLY_URL = f"http://{SHELLY_IP}/rpc/Switch.Set"
API_TOKEN = "mon-secret-token"  # Token simple pour l'API

# === Etat du relais ===
relais_allume = False

# === Fonction pour contrôler le relais Shelly ===
async def control_shelly(turn_on: bool):
    payload = {"id": 0, "on": turn_on}
    async with httpx.AsyncClient() as client:
        response = await client.post(SHELLY_URL, json=payload, timeout=10)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Erreur LAN Shelly : {response.text}")
    return response.json()

# === Middleware pour vérifier le token ===
async def check_token(x_api_token: str = Header(...)):
    if x_api_token != API_TOKEN:
        raise HTTPException(status_code=403, detail="Token invalide")

# === Allumer le relais ===
@app.post("/on")
async def turn_on(x_api_token: str = Header(...)):
    global relais_allume
    await check_token(x_api_token)
    if relais_allume:
        return {"success": False, "message": "Relais déjà allumé"}
    result = await control_shelly(True)
    relais_allume = True
    return {"success": True, "message": "Relais allumé", "data": result}

# === Éteindre le relais ===
@app.post("/off")
async def turn_off(x_api_token: str = Header(...)):
    global relais_allume
    await check_token(x_api_token)
    if not relais_allume:
        return {"success": False, "message": "Relais déjà éteint"}
    result = await control_shelly(False)
    relais_allume = False
    return {"success": True, "message": "Relais éteint", "data": result}

# === Status du relais ===
@app.get("/status")
async def status(x_api_token: str = Header(...)):
    await check_token(x_api_token)
    return {"relais_allume": relais_allume}
