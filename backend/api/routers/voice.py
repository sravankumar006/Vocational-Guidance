"""
Voice Router (Phase 8 Brick 30).
Provides high-fidelity, native regional Text-to-Speech (TTS) audio streaming
specifically ensuring Telugu and English counselling answers read aloud completely
and fluently without relying on host operating system speech packs.
"""

import asyncio
import re
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Query, Response, HTTPException
from pydantic import BaseModel, Field
import httpx

router = APIRouter(prefix="/voice", tags=["Voice"])

GOOGLE_TTS_URL = "https://translate.google.com/translate_tts"


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Text to synthesize")
    language: str = Field(default="te", description="Language code ('te' or 'en')")


def clean_text_for_speech(raw_text: str, language: str) -> str:
    """Pre-processes text for smooth regional speech synthesis."""
    cleaned = raw_text
    
    # Strip markdown headers, bold, italics, code
    cleaned = re.sub(r"[*#_~`]", "", cleaned)
    cleaned = re.sub(r"[-—]{2,}", "", cleaned)
    
    # Convert currency and mathematical symbols to natural Telugu words
    if language.startswith("te"):
        cleaned = re.sub(r"₹\s*([0-9,]+)", r"\1 రూపాయలు ", cleaned)
        cleaned = re.sub(r"([0-9,]+)\s*₹", r"\1 రూపాయలు ", cleaned)
        cleaned = re.sub(r"%", " శాతం ", cleaned)
        cleaned = re.sub(r"ITI", "ఐటీఐ", cleaned, flags=re.IGNORECASE)
    else:
        cleaned = re.sub(r"₹\s*([0-9,]+)", r"\1 rupees ", cleaned)
        cleaned = re.sub(r"%", " percent ", cleaned)
    
    # Normalize excessive whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def split_into_tts_chunks(text: str, max_chars: int = 160) -> list[str]:
    """Splits long answers into natural sentence/clause chunks under the TTS URL limit."""
    # Split on sentence terminals and clause breaks
    raw_parts = re.split(r"(?<=[.!?।\n:;])\s+", text)
    chunks: list[str] = []
    current = ""

    for part in raw_parts:
        part = part.strip()
        if not part:
            continue
        
        # If a single part is still larger than max_chars, split on commas or spaces
        if len(part) > max_chars:
            sub_parts = re.split(r"(?<=[,])\s+", part)
            for sub in sub_parts:
                sub = sub.strip()
                if not sub:
                    continue
                if len(current + " " + sub) <= max_chars:
                    current = f"{current} {sub}".strip()
                else:
                    if current:
                        chunks.append(current)
                    current = sub
        else:
            if len(current + " " + part) <= max_chars:
                current = f"{current} {part}".strip()
            else:
                if current:
                    chunks.append(current)
                current = part

    if current:
        chunks.append(current)

    return chunks or [text]


async def fetch_audio_chunks(chunks: list[str], lang_code: str) -> bytes:
    """Asynchronously fetches and stitches MP3 audio frames for all chunks."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    
    async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
        tasks = []
        for chunk in chunks:
            q = urllib.parse.quote(chunk)
            url = f"{GOOGLE_TTS_URL}?ie=UTF-8&tl={lang_code}&client=tw-ob&q={q}"
            tasks.append(client.get(url))
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        audio_stream = bytearray()
        for resp in responses:
            if isinstance(resp, httpx.Response) and resp.status_code == 200:
                audio_stream.extend(resp.content)
                
        return bytes(audio_stream)


@router.post("/tts")
async def generate_speech_post(payload: TTSRequest) -> Response:
    """
    Synthesize complete counselling answer text into high-fidelity MP3 audio.
    Particularly handles long Telugu responses by chunking and concatenating frames.
    """
    lang = "te" if payload.language.lower().startswith("te") else "en"
    cleaned = clean_text_for_speech(payload.text, lang)
    if not cleaned:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    chunks = split_into_tts_chunks(cleaned, max_chars=160)
    audio_bytes = await fetch_audio_chunks(chunks, lang)

    if not audio_bytes:
        raise HTTPException(status_code=502, detail="Failed to synthesize speech audio.")

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="counselling_voice.mp3"',
            "Cache-Control": "public, max-age=3600",
        },
    )


@router.get("/tts")
async def generate_speech_get(
    text: str = Query(..., min_length=1, max_length=5000),
    language: str = Query(default="te"),
) -> Response:
    """GET endpoint supporting direct HTML5 audio element streaming."""
    return await generate_speech_post(TTSRequest(text=text, language=language))
