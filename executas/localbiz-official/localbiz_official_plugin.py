"""LocalBiz AI Receptionist Executa Plugin for Anna OS."""

import json
import re
import sys

MANIFEST = {
    "name": "tool-dev-localbiz-official",
    "version": "1.0.0",
    "tools": [
        {
            "name": "ping",
            "description": "Health check smoke test.",
            "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
        },
        {
            "name": "handle_inquiry",
            "description": "Processes customer inquiries, extracts orders, and formulates smart receptionist responses.",
            "parameters": {
                "type": "object",
                "properties": {
                    "business_name": {"type": "string"},
                    "business_profile": {"type": "string"},
                    "menu_items": {"type": "string"},
                    "customer_message": {"type": "string"},
                },
                "required": ["customer_message"],
                "additionalProperties": False,
            },
        },
    ],
}


def detect_intent(msg: str) -> str:
    msg_l = msg.lower()
    if any(w in msg_l for w in ["order", "chahiye", "bhejo", "parcel", "pack", "deliver", "mangana"]):
        return "PLACE_ORDER"
    if any(w in msg_l for w in ["menu", "rate", "price", "pese", "deal", "list", "cost"]):
        return "INQUIRE_MENU"
    if any(w in msg_l for w in ["timing", "open", "address", "kahan", "location", "waqt", "band"]):
        return "INQUIRE_INFO"
    return "GENERAL_GREETING"


def extract_lead_entities(msg: str) -> dict:
    phone_match = re.search(r"(\+?92|0)?3\d{2}[-\s]?\d{7}", msg)
    return {
        "has_contact": bool(phone_match),
        "phone": phone_match.group(0) if phone_match else "Not provided",
        "is_delivery": bool(re.search(r"(deliver|home delivery|ghar|bhejo|parcel)", msg, re.IGNORECASE)),
    }


def invoke(method: str, args: dict) -> dict:
    if method == "ping":
        return {"success": True, "data": {"pong": True, "status": "online"}}

    if method == "handle_inquiry":
        biz_name = args.get("business_name", "Labaik Broast & Fast Food")
        biz_profile = args.get("business_profile", "Open daily: 4:00 PM - 2:00 AM. Free delivery on orders above Rs. 1000.")
        menu = args.get("menu_items", "Quarter Broast: Rs. 450 | Half: Rs. 850 | Zinger Burger: Rs. 380 | Family Deal: Rs. 1850")
        msg = args.get("customer_message", "").strip()

        if not msg:
            return {
                "success": True,
                "data": {
                    "reply": f"Salam! Welcome to {biz_name}. How can we assist you today?",
                    "intent": "GREETING",
                    "lead": {"has_contact": False, "phone": "None", "is_delivery": False},
                },
            }

        intent = detect_intent(msg)
        lead = extract_lead_entities(msg)

        if intent == "INQUIRE_MENU":
            reply = f"Salam! Hamari popular deals aur menu ye hain:\n{menu}\n\nAap kya order karna pasand karenge?"
        elif intent == "INQUIRE_INFO":
            reply = f"Thank you for reaching out to {biz_name}!\n{biz_profile}"
        elif intent == "PLACE_ORDER":
            reply = f"Jee bilkul! Order note karne ke liye barah-e-karam apna mukammal delivery address aur phone number share kar dein."
        else:
            reply = f"Salam! {biz_name} se rabta karne ka shukriya. Hum aapki kya khidmat kar sakte hain?"

        return {
            "success": True,
            "data": {
                "reply": reply,
                "intent": intent,
                "lead": lead,
                "business": biz_name,
            },
        }

    return {"success": False, "error": f"unknown method: {method}"}


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        req = json.loads(line)
        try:
            if req.get("method") == "describe":
                result = MANIFEST
            elif req.get("method") == "health":
                result = {"status": "ready"}
            elif req.get("method") == "invoke":
                result = invoke(req["params"]["tool"], req["params"].get("arguments", {}))
            else:
                raise ValueError(f"unknown rpc: {req.get('method')}")
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": req.get("id"), "result": result}) + "\n")
        except Exception as e:
            sys.stdout.write(
                json.dumps(
                    {
                        "jsonrpc": "2.0",
                        "id": req.get("id"),
                        "error": {"code": -32601, "message": str(e)},
                    }
                )
                + "\n"
            )
        sys.stdout.flush()


if __name__ == "__main__":
    main()
