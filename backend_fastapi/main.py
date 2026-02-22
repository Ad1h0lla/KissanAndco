import os
import sqlite3
import hashlib
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

ELEVENLABS_KEY = os.getenv('ELEVENLABS_API_KEY')
VOICE_ID = os.getenv('ELEVENLABS_VOICE_ID', 'KSsyodh37PbfWy29kPtx')
WEATHER_API_KEY = os.getenv('WEATHER_API_KEY')

DB_PATH = Path(__file__).parent / "farm.db"
CACHE_DIR = Path(__file__).parent / ".cache"
CACHE_DIR.mkdir(exist_ok=True)

app = FastAPI()

# Initialize SQLite DB with simple schema
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.executescript(r"""
    CREATE TABLE IF NOT EXISTS farm (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      area REAL,
      irrigationType TEXT,
      currentCrop TEXT
    );

    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmId INTEGER,
      name TEXT,
      crop TEXT,
      area REAL,
      status TEXT,
      waterAccess INTEGER DEFAULT 0,
      FOREIGN KEY(farmId) REFERENCES farm(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zoneId INTEGER,
      type TEXT,
      note TEXT,
      createdAt DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY(zoneId) REFERENCES zones(id)
    );
    """)
    conn.commit()
    conn.close()

init_db()

# Models
class VoiceRequest(BaseModel):
    text: str
    language: Optional[str] = 'kn'


@app.get('/api/health')
async def health():
    return {"status": "ok"}


@app.get('/api/farm')
async def get_farm():
    conn = get_db()
    cur = conn.cursor()
    farm = cur.execute('SELECT * FROM farm LIMIT 1').fetchone()
    if not farm:
        return None
    farm_obj = dict(farm)
    zones = cur.execute('SELECT * FROM zones WHERE farmId = ?', (farm_obj['id'],)).fetchall()
    farm_obj['zones'] = [dict(z) for z in zones]
    conn.close()
    return farm_obj


@app.post('/api/farm')
async def post_farm(req: Request):
    body = await req.json()
    name = body.get('name')
    location = body.get('location')
    latitude = body.get('latitude')
    longitude = body.get('longitude')
    area = body.get('area')
    irrigationType = body.get('irrigationType')
    zones = body.get('zones') or []

    conn = get_db()
    cur = conn.cursor()
    existing = cur.execute('SELECT * FROM farm LIMIT 1').fetchone()
    if existing:
        cur.execute('UPDATE farm SET name=?, location=?, latitude=?, longitude=?, area=?, irrigationType=? WHERE id=?',
                    (name, location, latitude, longitude, area, irrigationType, existing['id']))
        farmId = existing['id']
    else:
        cur.execute('INSERT INTO farm (name, location, latitude, longitude, area, irrigationType) VALUES (?, ?, ?, ?, ?, ?)',
                    (name, location, latitude, longitude, area, irrigationType))
        farmId = cur.lastrowid

    # remove events for zones first, then zones
    cur.execute('DELETE FROM events WHERE zoneId IN (SELECT id FROM zones WHERE farmId = ?)', (farmId,))
    cur.execute('DELETE FROM zones WHERE farmId = ?', (farmId,))

    if isinstance(zones, list):
        for z in zones:
            cur.execute('INSERT INTO zones (farmId, name, crop, area, status, waterAccess) VALUES (?, ?, ?, ?, ?, ?)',
                        (farmId, z.get('name'), z.get('crop'), z.get('area'), z.get('status'), 1 if z.get('waterAccess') else 0))

    conn.commit()
    farm_row = cur.execute('SELECT * FROM farm WHERE id = ?', (farmId,)).fetchone()
    zones_rows = cur.execute('SELECT * FROM zones WHERE farmId = ?', (farmId,)).fetchall()
    farm_obj = dict(farm_row)
    farm_obj['zones'] = [dict(z) for z in zones_rows]
    conn.close()
    return {"status": "success", "farm": farm_obj}


@app.get('/api/soil')
async def get_soil(lat: Optional[float] = 0.0, lon: Optional[float] = 0.0):
    # deterministic mock based on lat/lon
    try:
        seed = abs(int((lat * 1000 + lon * 1000))) % 100
    except Exception:
        seed = 0
    phBase = 6.0 + (seed % 5) * 0.1
    moisture = 30 + (seed % 40)
    textures = ['Sandy', 'Loamy', 'Clayey']
    texture = textures[seed % len(textures)]
    nitrogen = ['Low', 'Medium', 'High'][seed % 3]
    phosphorus = ['Low', 'Medium', 'High'][(seed + 1) % 3]
    potassium = ['Low', 'Medium', 'High'][(seed + 2) % 3]
    organic = round(1.5 + (seed % 40) * 0.02, 1)
    return {
        'ph': round(phBase, 1),
        'texture': texture,
        'moisture': f"{moisture}%",
        'nitrogen': nitrogen,
        'phosphorus': phosphorus,
        'potassium': potassium,
        'organic_matter': f"{organic}%"
    }


@app.get('/api/weather')
async def get_weather(lat: float, lon: float):
    if not WEATHER_API_KEY:
        return JSONResponse({"current": {"temp_c": 28, "condition": {"text": "Sunny"}}})
    url = f"http://api.weatherapi.com/v1/forecast.json?key={WEATHER_API_KEY}&q={lat},{lon}&days=3"
    r = requests.get(url, timeout=10)
    if r.status_code != 200:
        return JSONResponse({"current": {"temp_c": 28, "condition": {"text": "Sunny"}}})
    return JSONResponse(r.json())


@app.post('/api/zone/{zone_id}/schedule-irrigation')
async def schedule_irrigation(zone_id: int, req: Request):
    note_body = await req.json()
    note = note_body.get('note') if isinstance(note_body, dict) else None
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO events (zoneId, type, note) VALUES (?, ?, ?)', (zone_id, 'irrigation', note or 'Scheduled irrigation'))
        cur.execute('UPDATE zones SET status = ? WHERE id = ?', ('Irrigation Scheduled', zone_id))
        conn.commit()
        zone = cur.execute('SELECT * FROM zones WHERE id = ?', (zone_id,)).fetchone()
        return {"status": 'success', 'zone': dict(zone)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post('/api/zone/{zone_id}/log-harvest')
async def log_harvest(zone_id: int, req: Request):
    note_body = await req.json()
    note = note_body.get('note') if isinstance(note_body, dict) else None
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO events (zoneId, type, note) VALUES (?, ?, ?)', (zone_id, 'harvest', note or 'Harvest logged'))
        cur.execute('UPDATE zones SET status = ? WHERE id = ?', ('Resting', zone_id))
        conn.commit()
        zone = cur.execute('SELECT * FROM zones WHERE id = ?', (zone_id,)).fetchone()
        return {"status": 'success', 'zone': dict(zone)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


def hash_text(s: str) -> str:
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


@app.post('/api/voice')
async def voice(req: VoiceRequest):
    text = req.text
    language = req.language or 'kn'
    if not ELEVENLABS_KEY:
        raise HTTPException(status_code=500, detail='ElevenLabs API key not configured')

    # cache by text hash
    h = hash_text(f"{language}:{text}")
    cache_file = CACHE_DIR / f"{h}.mp3"
    if cache_file.exists():
        return StreamingResponse(cache_file.open('rb'), media_type='audio/mpeg')

    # Call ElevenLabs TTS
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    payload = {
        "text": text,
        "model": "eleven_multilingual_v2",
        "voice": VOICE_ID
    }
    headers = {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json'
    }
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=30)
        if r.status_code != 200 and r.status_code != 201:
            raise HTTPException(status_code=502, detail=f'Voice provider error: {r.status_code} {r.text}')
        # write to cache
        with open(cache_file, 'wb') as f:
            f.write(r.content)
        return StreamingResponse(open(cache_file, 'rb'), media_type='audio/mpeg')
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=str(e))


# Lightweight run when using `python -m backend_fastapi.main`
if __name__ == '__main__':
    import uvicorn
    uvicorn.run('backend_fastapi.main:app', host='0.0.0.0', port=3000, reload=True)
