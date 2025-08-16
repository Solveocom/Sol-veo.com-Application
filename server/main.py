import qrcode
import base64
from io import BytesIO

from fastapi import FastAPI
from pydantic import BaseModel
import uuid

app = FastAPI()

class PayRequest(BaseModel):
    duration: int

@app.post("/pay")
def create_payment(data: PayRequest):
    transaction_id = str(uuid.uuid4())
    payment_url = f"https://twint.fakepay.ch/pay/{transaction_id}?duration={data.duration}"

    qr = qrcode.make(payment_url)
    buffered = BytesIO()
    qr.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "transactionId": transaction_id,
        "qrCodeBase64": img_str,
        "paymentUrl": payment_url
    }
