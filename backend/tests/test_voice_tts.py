"""
Tests for Voice TTS Router (Brick 30 Voice Counselling).
Verifies that Telugu and English text-to-speech synthesis endpoints
properly validate inputs, clean symbols, and stream valid MP3 audio.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_voice_tts_post_telugu():
    """Verify POST /api/voice/tts returns MP3 stream for Telugu text."""
    payload = {
        "text": "మీ అబ్బాయి ఆసక్తిని పరిగణనలోకి తీసుకుంటే, ఆటోమోటివ్ సర్వీస్ టెక్నీషియన్ ఉత్తమమైన ఎంపిక.",
        "language": "te",
    }
    response = client.post("/api/voice/tts", json=payload)
    assert response.status_code == 200
    assert "audio/mpeg" in response.headers.get("content-type", "")
    assert len(response.content) > 1000


def test_voice_tts_get_telugu():
    """Verify GET /api/voice/tts allows direct HTML5 audio streaming."""
    response = client.get("/api/voice/tts", params={
        "text": "నమస్కారం",
        "language": "te",
    })
    assert response.status_code == 200
    assert "audio/mpeg" in response.headers.get("content-type", "")
    assert len(response.content) > 500


def test_voice_tts_empty_text_rejected():
    """Verify empty text rejects with 422 or 400."""
    response = client.post("/api/voice/tts", json={"text": "", "language": "te"})
    assert response.status_code in [400, 422]
