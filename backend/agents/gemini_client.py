"""
NAV — Navigate, Analyze, Validate
Shared Gemini AI client with smart multi-model quota rotation.
If any model hits a 429 rate limit, it IMMEDIATELY rotates to the next available model
without making the user wait 60 seconds.
"""
import os
import json
import re
import time
import google.generativeai as genai
from google.api_core import exceptions
from dotenv import load_dotenv
from utils.supabase_db import get_app_config

load_dotenv()

# Pool of high-speed models that have separate rate limits
MODEL_POOL = [
    "gemini-3.7-flash",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
]

_current_model_index = 0
_configured = False


def _ensure_configured():
    global _configured
    if _configured:
        return

    key = os.environ.get("GEMINI_API_KEY", "").strip()
    placeholder_keys = ["PASTE_YOUR_GEMINI_KEY_HERE", "your_gemini_api_key_here", ""]

    if not key or key in placeholder_keys:
        key = get_app_config("GEMINI_API_KEY")

    if not key:
        raise ValueError(
            "GEMINI_API_KEY is not configured! Please provide it in backend/.env or in Supabase app_config table."
        )

    genai.configure(api_key=key)
    _configured = True


def get_model(model_name: str):
    _ensure_configured()
    return genai.GenerativeModel(
        model_name=model_name,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )


def call_gemini(prompt: str, max_retries: int = len(MODEL_POOL) * 2) -> dict:
    """Call Gemini with instant model rotation when any model hits a rate limit."""
    global _current_model_index
    _ensure_configured()

    for attempt in range(max_retries):
        model_name = MODEL_POOL[_current_model_index % len(MODEL_POOL)]
        try:
            model = get_model(model_name)
            response = model.generate_content(prompt)
            text = response.text.strip()
            # Strip markdown code fences if present
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            return json.loads(text)
        except (exceptions.ResourceExhausted, exceptions.TooManyRequests) as e:
            # INSTANT ROTATION: Switch to next model immediately without sleeping!
            _current_model_index += 1
            next_model = MODEL_POOL[_current_model_index % len(MODEL_POOL)]
            print(f"[Quota Notice] {model_name} rate limit reached. Instantly rotating to {next_model} (attempt {attempt + 1})...")
            # Only sleep a tiny fraction if we looped through all models once
            if attempt >= len(MODEL_POOL):
                time.sleep(5)
        except Exception as e:
            print(f"[Gemini Error on {model_name}] {e}. Rotating to next model...")
            _current_model_index += 1
            time.sleep(2)

    raise RuntimeError("All models in the quota pool exceeded their limits. Please retry in 1 minute.")


def call_gemini_text(prompt: str, max_retries: int = len(MODEL_POOL) * 2) -> str:
    """Call Gemini for plain text with instant model rotation."""
    global _current_model_index
    _ensure_configured()

    for attempt in range(max_retries):
        model_name = MODEL_POOL[_current_model_index % len(MODEL_POOL)]
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=genai.types.GenerationConfig(temperature=0.3),
            )
            response = model.generate_content(prompt)
            return response.text.strip()
        except (exceptions.ResourceExhausted, exceptions.TooManyRequests) as e:
            _current_model_index += 1
            next_model = MODEL_POOL[_current_model_index % len(MODEL_POOL)]
            print(f"[Quota Notice] {model_name} rate limit reached. Instantly rotating to {next_model}...")
            if attempt >= len(MODEL_POOL):
                time.sleep(5)
        except Exception as e:
            _current_model_index += 1
            time.sleep(2)

    raise RuntimeError("All models in the quota pool exceeded their limits.")
