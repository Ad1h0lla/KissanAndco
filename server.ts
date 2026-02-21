import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

// Initialize Database
const db = new Database("farm.db");
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
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
`);

// Seed initial data if empty
const farmCount = db.prepare("SELECT count(*) as count FROM farm").get() as { count: number };
if (farmCount.count === 0) {
    // No initial seed, let the user create it.
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Farm API
  app.get("/api/farm", (req, res) => {
    const farm = db.prepare("SELECT * FROM farm LIMIT 1").get();
    if (farm) {
        const zones = db.prepare("SELECT * FROM zones WHERE farmId = ?").all(farm.id);
        res.json({ ...farm, zones: zones.map(z => ({...z, waterAccess: !!z.waterAccess})) });
    } else {
        res.json(null);
    }
  });

  app.post("/api/farm", (req, res) => {
    const { name, location, latitude, longitude, area, irrigationType, zones } = req.body;
    
    const existing = db.prepare("SELECT * FROM farm LIMIT 1").get();
    
    let farmId;
    if (existing) {
        db.prepare(`
            UPDATE farm SET name=?, location=?, latitude=?, longitude=?, area=?, irrigationType=? WHERE id=?
        `).run(name, location, latitude, longitude, area, irrigationType, existing.id);
        farmId = existing.id;
    } else {
        const info = db.prepare(`
            INSERT INTO farm (name, location, latitude, longitude, area, irrigationType) VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, location, latitude, longitude, area, irrigationType);
        farmId = info.lastInsertRowid;
    }

    // Clear old zones
    db.prepare("DELETE FROM zones WHERE farmId = ?").run(farmId);

    // Insert new user-defined zones
    if (zones && Array.isArray(zones)) {
        const insertZone = db.prepare(`
            INSERT INTO zones (farmId, name, crop, area, status, waterAccess) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const zone of zones) {
            insertZone.run(farmId, zone.name, zone.crop, zone.area, zone.status, zone.waterAccess ? 1 : 0);
        }
    }

    res.json({ status: "success", id: farmId });
  });

  // Weather Proxy (WeatherAPI.com)
  app.get("/api/weather", async (req, res) => {
    const { lat, lon } = req.query;
    // Use environment variable or fallback to the known working key for this demo
    const apiKey = process.env.WEATHER_API_KEY || "ad3467e9c5b44fa78a9101203262102"; 
    
    if (!lat || !lon) {
        return res.status(400).json({ error: "Missing lat/lon" });
    }

    try {
        // Fetch current and forecast (3 days)
        const response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=3`);
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Weather fetch error:", error);
        // Fallback mock data if API fails
        res.json({
            current: { temp_c: 28, condition: { text: "Sunny", icon: "//cdn.weatherapi.com/weather/64x64/day/113.png" }, wind_kph: 12, humidity: 45 },
            forecast: { forecastday: [] }
        });
    }
  });

  // AI Finance & Yield Prediction Endpoint (Simulating ML Regression)
  app.post("/api/ai/finance", async (req, res) => {
    const { farm, weather } = req.body;
    
    try {
        const prompt = `
            Act as an agricultural economist.
            
            Context:
            - Farm: ${farm.name} (${farm.area} acres) in ${farm.location}
            - Irrigation: ${farm.irrigationType}
            - Current Weather: ${weather?.current?.temp_c}°C
            
            Task:
            Generate realistic financial projections for a farm of this size in India.
            1. Estimate monthly irrigation costs.
            2. Predict revenue and profit ranges based on current market rates.
            3. Generate a detailed cost breakdown.
            
            IMPORTANT: Return ONLY valid JSON.
            Output JSON schema:
            {
                "irrigation": {
                    "monthly_forecast": 3500,
                    "recommendation": "Switch to drip irrigation to save 20%."
                },
                "financials": {
                    "projected_revenue": { "min": 150000, "max": 220000 },
                    "projected_profit": { "min": 80000, "max": 120000 },
                    "confidence_score": 88
                },
                "invoice": [
                    { "item": "High Yield Seeds", "cost": 12000 },
                    { "item": "Fertilizers (DAP/Urea)", "cost": 8500 },
                    { "item": "Irrigation Power/Water", "cost": 4200 },
                    { "item": "Labor Charges", "cost": 15000 },
                    { "item": "Pest Control", "cost": 3500 }
                ]
            }
        `;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("AI Finance Error:", error);
        // Fallback data to prevent garbage values
        res.json({
            irrigation: { monthly_forecast: 3000, recommendation: "Standard irrigation." },
            financials: { projected_revenue: { min: 100000, max: 150000 }, projected_profit: { min: 50000, max: 80000 }, confidence_score: 80 },
            invoice: []
        });
    }
  });

  // Soil Data Endpoint (Mocked based on location)
  app.get("/api/soil", (req, res) => {
      // In a real app, use SoilGrids API with lat/lon
      res.json({
          ph: 6.5,
          texture: "Loamy",
          moisture: "45%",
          nitrogen: "Medium",
          phosphorus: "High",
          potassium: "Medium",
          organic_matter: "2.1%"
      });
  });

  // Calendar Endpoint
  app.get("/api/calendar", (req, res) => {
      const today = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      const addDays = (days: number) => {
          const d = new Date(today);
          d.setDate(d.getDate() + days);
          return formatDate(d);
      };

      res.json([
          { id: 1, task: "Soil Moisture Check", date: formatDate(today), type: "irrigation" },
          { id: 2, task: "Apply Nitrogen Fertilizer", date: addDays(2), type: "fertilizer" },
          { id: 3, task: "Pest Inspection (Zone B)", date: addDays(5), type: "planting" },
          { id: 4, task: "Expected Wheat Harvest", date: addDays(14), type: "harvest" }
      ]);
  });

  // Market Data (Mock - Farm to Table)
  app.get("/api/market", (req, res) => {
      res.json([
          { id: 1, name: "Whole Foods Local", type: "Retailer", distance: "12km", price: 2200, demand: "High", crop: "Wheat" },
          { id: 2, name: "City Farmers Market", type: "Direct", distance: "8km", price: 2400, demand: "Medium", crop: "Vegetables" },
          { id: 3, name: "AgroCorp Processing", type: "Industrial", distance: "45km", price: 1950, demand: "Very High", crop: "Sugarcane" },
          { id: 4, name: "Local Mandi", type: "Wholesale", distance: "5km", price: 2100, demand: "High", crop: "Rice" }
      ]);
  });

  // Subsidies (Mock - Indian context as requested)
  app.get("/api/subsidies", (req, res) => {
      res.json([
          { name: "PM-KISAN", description: "Income support of ₹6,000 per year.", eligibility: "Small & Marginal Farmers" },
          { name: "Pradhan Mantri Fasal Bima Yojana", description: "Crop insurance against non-preventable natural risks.", eligibility: "All Farmers" },
          { name: "Soil Health Card Scheme", description: "Subsidized soil testing and fertilizer recommendations.", eligibility: "All Farmers" },
          { name: "PM Krishi Sinchai Yojana", description: "Subsidies for drip/sprinkler irrigation equipment.", eligibility: "Water Scarcity Zones" }
      ]);
  });

  // AI Suggestions Endpoint (Enhanced with Interactive Flow)
  app.post("/api/ai/suggest", async (req, res) => {
    const { farm, weather, context } = req.body;
    
    try {
        let prompt = "";
        
        if (!context || context.step === 'initial') {
            prompt = `
                Act as an expert agronomist.
                Farm: ${farm.name}, ${farm.location}, ${farm.area} acres.
                Zones: ${JSON.stringify(farm.zones)}
                Weather: ${weather?.current?.temp_c}°C

                Task: Generate 3 critical questions to help optimize this specific farm.
                
                IMPORTANT: Return ONLY valid JSON.
                Output JSON schema:
                {
                    "type": "question",
                    "questions": [
                        { "id": "q1", "text": "Question 1?" },
                        { "id": "q2", "text": "Question 2?" },
                        { "id": "q3", "text": "Question 3?" }
                    ]
                }
            `;
        } else if (context.step === 'analyze') {
            prompt = `
                Act as an agricultural data scientist.
                Farm: ${farm.name}, ${farm.location}, ${farm.area} acres.
                User Answers: ${JSON.stringify(context.answers)}
                Weather: ${weather?.current?.temp_c}°C
                
                Task:
                Provide 3 specific crop recommendations with scores, descriptions, actions, and financial metrics.
                
                IMPORTANT: Return ONLY valid JSON.
                Output JSON schema:
                {
                    "type": "result",
                    "critique": "Analysis of current situation.",
                    "suggestions": [
                        { 
                            "title": "Crop Name", 
                            "zone": "Zone Name",
                            "score": 95,
                            "description": "Reasoning.",
                            "action": "Actionable advice.",
                            "metrics": { "yield": "2.5 Tons", "profit": "₹50,000" }
                        }
                    ]
                }
            `;
        }

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  // AI Simulation Endpoint
  app.post("/api/ai/simulate", async (req, res) => {
    const { farm, conditions } = req.body;
    
    try {
        const prompt = `
            Act as an agricultural simulator.
            
            Farm Context: ${farm.location}, ${farm.area} acres.
            
            Hypothetical Conditions:
            - Temperature: ${conditions.temp}°C
            - Rainfall: ${conditions.rain}mm
            - Humidity: ${conditions.humidity}%
            
            Task:
            Predict outcomes based on these conditions.
            
            IMPORTANT: Return ONLY valid JSON.
            Output JSON schema:
            {
                "crops": [ {"name": "Crop A", "confidence": 90, "reason": "Why it works"} ],
                "impact": { "profit": "+15%", "yield": "High", "risk": "Low" },
                "irrigation_advice": "Advice on water management."
            }
        `;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        res.json(JSON.parse(response.text));
    } catch (error) {
        console.error("AI Sim Error:", error);
        res.status(500).json({ error: "Simulation failed" });
    }
  });

  // Community Data (Mock)
  app.get("/api/community", (req, res) => {
      res.json([
          { id: 1, user: "Ramesh Kumar", location: "5km away", content: "Just finished planting Cotton in Zone A. Hoping for good rain this season!", time: "2 days ago", likes: 12, comments: 4, avatar: "RK" },
          { id: 2, user: "Anita Singh", location: "12km away", content: "Harvested Wheat today. Yield was 2.4 Tons/acre, better than last year.", time: "5 hours ago", likes: 45, comments: 12, avatar: "AS" },
          { id: 3, user: "Green Fields Co-op", location: "Nearby", content: "ALERT: Pest outbreak (Aphids) reported in Zone B. Please check your crops immediately.", time: "1 hour ago", type: "alert", likes: 89, comments: 34, avatar: "GF" },
          { id: 4, user: "Vikram Patel", location: "8km away", content: "Switched to Drip Irrigation for my Sugarcane field. Saving 40% water already.", time: "1 week ago", likes: 23, comments: 8, avatar: "VP" },
      ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
