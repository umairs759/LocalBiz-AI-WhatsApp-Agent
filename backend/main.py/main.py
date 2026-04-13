import os
import logging
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
from utils.ai_failover import get_ai_reply

load_dotenv()
app = FastAPI(title="LocalBiz AI WhatsApp Agent", version="1.0.0")

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
VERIFY_TOKEN = os.getenv("VERIFY_TOKEN")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")

logging.basicConfig(level=logging.INFO)

@app.get("/webhook")
async def verify_webhook(mode: str, token: str, challenge: str):
    if mode == "subscribe" and token == VERIFY_TOKEN:
        return int(challenge)
    raise HTTPException(status_code=403)

@app.post("/webhook")
async def handle_whatsapp(request: Request):
    body = await request.json()
    try:
        entry = body["entry"][0]
        changes = entry["changes"][0]
        value = changes["value"]
        if "messages" in value:
            msg = value["messages"][0]
            sender = msg["from"]
            text = msg["text"]["body"]
            
            # Pure English message – no Hinglish processing
            ai_reply = await get_ai_reply(text)
            send_whatsapp_message(sender, ai_reply)
    except Exception as e:
        logging.error(f"Webhook error: {e}")
    return {"status": "ok"}

def send_whatsapp_message(to: str, message: str):
    url = f"https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message}
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200:
        logging.error(f"Failed to send: {response.text}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)