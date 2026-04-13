import os
import logging
from groq import Groq
import google.generativeai as genai

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")

SYSTEM_PROMPT = """You are a helpful AI receptionist for local businesses (salon, clinic, cloud kitchen). 
Respond in clear, professional English. Handle appointments, pricing, opening hours, and basic FAQs. 
Never ask for OTP, passwords, or sensitive information. Keep replies concise and friendly."""

async def get_ai_reply(user_message: str) -> str:
    try:
        # Primary: Groq Llama 3.3
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=300
        )
        reply = completion.choices[0].message.content
        logging.info("Groq reply success")
        return reply
    except Exception as e:
        logging.warning(f"Groq failed: {e}. Falling back to Gemini.")
        try:
            response = gemini_model.generate_content(
                f"{SYSTEM_PROMPT}\nUser: {user_message}"
            )
            reply = response.text
            logging.info("Gemini fallback success")
            return reply
        except Exception as e2:
            logging.error(f"Both engines failed: {e2}")
            return "Sorry, I'm temporarily unavailable. Please try again in a moment."