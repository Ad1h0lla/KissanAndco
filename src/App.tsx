import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Sprout, CloudRain, TrendingUp, Store,
  MapPin, Bell, Droplets, Wind, Sun, X, FileText,
  ChevronLeft, ChevronRight, Sparkles, BrainCircuit, DollarSign, ArrowUpRight, Users, Activity,
  Calendar as CalendarIcon, Leaf, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FarmMap } from './components/FarmMap';
import { Card, StatCard } from './components/ui/Card';
import { Modal } from './components/ui/Modal';
import { LandForm } from './components/LandForm';
import VoiceAssistant from './components/VoiceAssistant';


// Types
interface FarmData {
  id: number;
  name: string;
  location: string;
  area: number;
  zones: any[];
  latitude: number;
  longitude: number;
}

export default function App() {
  const [farm, setFarm] = useState<FarmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [soil, setSoil] = useState<any>(null);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [market, setMarket] = useState<any[]>([]);
  const [subsidies, setSubsidies] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingFarm, setIsEditingFarm] = useState(false);

  // AI & Finance State
  const [aiState, setAiState] = useState<'initial' | 'questions' | 'results'>('initial');
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiCritique, setAiCritique] = useState<string>("");
  const [financeData, setFinanceData] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // Market Modal
  const [selectedMarket, setSelectedMarket] = useState<any>(null);
  // Crop Doctor
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState('');

  // Community
  interface CommunityPost {
    id: number; author: string; avatar: string; location: string; time: string;
    text: string; image?: string; tag: string; likes: number; likedByMe: boolean;
    comments: { author: string; avatar: string; text: string }[];
    showComments: boolean;
  }
  const [posts, setPosts] = useState<CommunityPost[]>([
    { id: 1, author: 'Ramesh Patil', avatar: 'https://picsum.photos/seed/ramesh/100/100', location: 'Nashik, Maharashtra', time: '2h ago', text: 'My cotton crop finally showing recovery after the fungicide treatment! Soil moisture back to 62%. Anyone else dealing with late blight?', image: 'https://picsum.photos/seed/cotton1/800/450', tag: 'Crop Health', likes: 34, likedByMe: false, comments: [{ author: 'Suresh Kumar', avatar: 'https://picsum.photos/seed/suresh/100/100', text: 'Which fungicide did you use bhai?' }, { author: 'Meera Devi', avatar: 'https://picsum.photos/seed/meera/100/100', text: 'Neem oil spray also works!' }], showComments: false },
    { id: 2, author: 'Gurpreet Singh', avatar: 'https://picsum.photos/seed/gurpreet/100/100', location: 'Amritsar, Punjab', time: '5h ago', text: 'Wheat yield this rabi season: 52 quintals/acre — best in 6 years! Credit goes to PM-KISAN subsidy.', tag: 'Success Story', likes: 127, likedByMe: true, comments: [{ author: 'Anita Sharma', avatar: 'https://picsum.photos/seed/anita/100/100', text: 'Congratulations! Which variety did you sow?' }], showComments: false },
    { id: 3, author: 'Kavitha Reddy', avatar: 'https://picsum.photos/seed/kavitha/100/100', location: 'Guntur, Andhra Pradesh', time: '1d ago', text: 'Heavy unseasonal rain warning for AP districts — covering my chilli beds tonight. All farmers please take precautions.', image: 'https://picsum.photos/seed/rain_farm/800/450', tag: 'Weather Alert', likes: 89, likedByMe: false, comments: [], showComments: false },
  ]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostTag, setNewPostTag] = useState('General');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostImageName, setNewPostImageName] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  // Simulator
  const CROP_PROFILES: Record<string, { name: string; emoji: string; season: string; baseYield: number; priceMin: number; priceMax: number; seedCost: number; fertCost: number; irrigCost: number; pestCost: number; labourCost: number; overheadCost: number; waterSensitivity: number; heatSensitivity: number; pestRisk: number; growthDays: number; color: string }> = {
    wheat: { name: 'Wheat', emoji: '🌾', season: 'Rabi (Oct–Mar)', baseYield: 22, priceMin: 1800, priceMax: 2400, seedCost: 2200, fertCost: 3500, irrigCost: 2800, pestCost: 1200, labourCost: 4500, overheadCost: 1800, waterSensitivity: 0.6, heatSensitivity: 0.5, pestRisk: 0.25, growthDays: 120, color: '#f59e0b' },
    rice: { name: 'Rice', emoji: '🌾', season: 'Kharif (Jun–Nov)', baseYield: 25, priceMin: 1900, priceMax: 2600, seedCost: 2800, fertCost: 4200, irrigCost: 6000, pestCost: 2000, labourCost: 6000, overheadCost: 2200, waterSensitivity: 0.3, heatSensitivity: 0.4, pestRisk: 0.35, growthDays: 130, color: '#10b981' },
    cotton: { name: 'Cotton', emoji: '🪴', season: 'Kharif (May–Dec)', baseYield: 8, priceMin: 5500, priceMax: 7500, seedCost: 4500, fertCost: 5000, irrigCost: 4500, pestCost: 3500, labourCost: 7000, overheadCost: 2500, waterSensitivity: 0.5, heatSensitivity: 0.6, pestRisk: 0.55, growthDays: 180, color: '#8b5cf6' },
    maize: { name: 'Maize', emoji: '🌽', season: 'Kharif (Jun–Oct)', baseYield: 30, priceMin: 1400, priceMax: 2000, seedCost: 2000, fertCost: 3000, irrigCost: 2200, pestCost: 1500, labourCost: 3500, overheadCost: 1500, waterSensitivity: 0.55, heatSensitivity: 0.45, pestRisk: 0.30, growthDays: 100, color: '#f97316' },
    tomato: { name: 'Tomato', emoji: '🍅', season: 'Year-round', baseYield: 120, priceMin: 800, priceMax: 3000, seedCost: 6000, fertCost: 8000, irrigCost: 5000, pestCost: 4000, labourCost: 9000, overheadCost: 3500, waterSensitivity: 0.4, heatSensitivity: 0.7, pestRisk: 0.60, growthDays: 90, color: '#ef4444' },
    soybean: { name: 'Soybean', emoji: '🫘', season: 'Kharif (Jun–Oct)', baseYield: 18, priceMin: 3800, priceMax: 5000, seedCost: 3000, fertCost: 2500, irrigCost: 2000, pestCost: 1800, labourCost: 4000, overheadCost: 1600, waterSensitivity: 0.5, heatSensitivity: 0.5, pestRisk: 0.30, growthDays: 105, color: '#84cc16' },
  };
  const [simCrop, setSimCrop] = useState('wheat');
  const [simArea, setSimArea] = useState<number>(2);
  const [simRainfall, setSimRainfall] = useState<'low' | 'normal' | 'high'>('normal');
  const [simMarket2, setSimMarket2] = useState<'bearish' | 'normal' | 'bullish'>('normal');
  const [simPestControl, setSimPestControl] = useState<'none' | 'basic' | 'intensive'>('basic');
  const [simIrrigation, setSimIrrigation] = useState<'rainfed' | 'partial' | 'full'>('partial');
  const [simHasInsurance, setSimHasInsurance] = useState(false);
  const [simResults, setSimResults] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simTab, setSimTab] = useState<'setup' | 'results'>('setup');

  useEffect(() => {
    fetchFarmData();
    fetchSubsidies();
    fetchSoilData();
    fetchCalendar();
  }, []);


  useEffect(() => {
    const handleWeather = () => setActiveTab('overview');
    const handleCrop = () => setActiveTab('ai-suggestions');
    const handleMap = () => setActiveTab('overview');
    const handleIrrig = () => setActiveTab('overview');
    const handleMarket = () => setActiveTab('market');
    const handleSubsidy = () => setActiveTab('subsidies');
    const handleCalendar = () => setActiveTab('calendar');
    const handleAdvisor = () => setActiveTab('ai-suggestions');
    const handleTutorial = () => setActiveTab('tutorial');

    window.addEventListener('open-weather', handleWeather);
    window.addEventListener('open-crop', handleCrop);
    window.addEventListener('open-map', handleMap);
    window.addEventListener('open-irrigation', handleIrrig);
    window.addEventListener('open-market', handleMarket);
    window.addEventListener('open-subsidy', handleSubsidy);
    window.addEventListener('open-calendar', handleCalendar);
    window.addEventListener('open-advisor', handleAdvisor);
    window.addEventListener('open-tutorial', handleTutorial);

    return () => {
      window.removeEventListener('open-weather', handleWeather);
      window.removeEventListener('open-crop', handleCrop);
      window.removeEventListener('open-map', handleMap);
      window.removeEventListener('open-irrigation', handleIrrig);
      window.removeEventListener('open-market', handleMarket);
      window.removeEventListener('open-subsidy', handleSubsidy);
      window.removeEventListener('open-calendar', handleCalendar);
      window.removeEventListener('open-advisor', handleAdvisor);
      window.removeEventListener('open-tutorial', handleTutorial);
    };
  }, []);



  // Trigger AI fetch when relevant tabs are selected
  useEffect(() => {
    if ((activeTab === 'finance' || activeTab === 'overview') && !financeData) {
      fetchAiFinance();
    }
  }, [activeTab, farm, weather]);

  // Run simulation locally
  const runSimulation = () => {
    const _crop = simCrop, _area = simArea, _rainfall = simRainfall, _market = simMarket2, _pest = simPestControl, _irrigation = simIrrigation, _insurance = simHasInsurance;
    setSimLoading(true);
    setTimeout(() => {
      const crop = CROP_PROFILES[_crop];
      const areaNum = Number(_area) || 1;
      const rainfallMod = { low: _crop === 'rice' ? 0.30 : 0.52, normal: 1.0, high: _crop === 'rice' ? 1.05 : 0.78 }[_rainfall];
      const irrigMod = { rainfed: 0.52, partial: 0.85, full: 1.0 }[_irrigation];
      const pestMod = { none: Math.max(0.10, 1 - crop.pestRisk * 2.2), basic: 1 - crop.pestRisk * 0.45, intensive: 1 - crop.pestRisk * 0.10 }[_pest];
      const priceMod = { bearish: 0.68, normal: 1.0, bullish: 1.25 }[_market];
      const baseYield = crop.baseYield * areaNum;
      const yieldQ = baseYield * rainfallMod * irrigMod * pestMod;
      const pestCostMult = { none: 0.0, basic: 1.0, intensive: 2.0 }[_pest];
      const irrigCostMult = { rainfed: 0.0, partial: 0.6, full: 1.0 }[_irrigation];
      const labourCost = areaNum * crop.labourCost;
      const overheadCost = areaNum * crop.overheadCost;
      const inputCost = areaNum * (crop.seedCost + crop.fertCost + crop.irrigCost * irrigCostMult + crop.pestCost * pestCostMult);
      const totalCost = inputCost + labourCost + overheadCost;
      const insuranceCost = _insurance ? totalCost * 0.045 : 0;
      const totalInvestment = totalCost + insuranceCost;
      const avgPrice = (crop.priceMin + crop.priceMax) / 2 * priceMod;
      const scenarios = [
        { label: 'Pessimistic', yieldMult: 0.55, priceMult: 0.72, color: '#ef4444', bgColor: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '↘' },
        { label: 'Expected', yieldMult: 1.00, priceMult: 1.00, color: '#10b981', bgColor: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '→' },
        { label: 'Optimistic', yieldMult: 1.22, priceMult: 1.18, color: '#3b82f6', bgColor: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '↗' },
      ].map(s => { const yQ = yieldQ * s.yieldMult, price = avgPrice * s.priceMult, revenue = yQ * price; let profit = revenue - totalInvestment; if (_insurance && profit < -totalInvestment * 0.30) profit = -totalInvestment * 0.30; return { ...s, yield: yQ, price, revenue, profit, roi: totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0 }; });
      const riskScore = Math.min(97, Math.max(5, [crop.pestRisk * (_pest === 'none' ? 3.5 : _pest === 'basic' ? 1.2 : 0.4) * 25, _rainfall === 'low' ? 30 : _rainfall === 'high' ? 18 : 5, _irrigation === 'rainfed' ? 28 : _irrigation === 'partial' ? 12 : 3, _market === 'bearish' ? 22 : _market === 'bullish' ? 4 : 8, _insurance ? -18 : 0, scenarios[0].profit < 0 ? 15 : 0].reduce((a, b) => a + b, 0)));
      const breakEvenYield = totalInvestment / avgPrice, breakEvenPct = (breakEvenYield / (yieldQ || 1)) * 100;
      const costBreakdown = [
        { label: 'Seeds & Planting', value: areaNum * crop.seedCost, color: '#6366f1' },
        { label: 'Fertilizers', value: areaNum * crop.fertCost, color: '#f59e0b' },
        { label: 'Irrigation', value: areaNum * crop.irrigCost * irrigCostMult, color: '#3b82f6' },
        { label: 'Pest Control', value: areaNum * crop.pestCost * pestCostMult, color: '#10b981' },
        { label: 'Labour', value: labourCost, color: '#f97316' },
        { label: 'Overhead', value: overheadCost, color: '#8b5cf6' },
        { label: 'Insurance', value: insuranceCost, color: '#ec4899' },
      ].filter(c => c.value > 0);
      const recs: string[] = [];
      if (scenarios[0].profit < 0) recs.push(`🔴 Pessimistic scenario shows a loss of ₹${Math.abs(Math.round(scenarios[0].profit)).toLocaleString()}. Real risk.`);
      if (scenarios[1].profit < 0) recs.push('⚠️ Even the Expected scenario projects a loss. Reconsider before committing.');
      if (_irrigation === 'rainfed' && _rainfall === 'low') recs.push('💧 Rainfed + low rainfall: expect 50%+ yield loss.');
      if (_pest === 'none' && crop.pestRisk > 0.4) recs.push(`🐛 ${crop.name} has ${Math.round(crop.pestRisk * 100)}% pest risk. Skip pest control at your peril.`);
      if (breakEvenPct > 80) recs.push(`⚖️ You need ${breakEvenPct.toFixed(0)}% of expected yield just to break even.`);
      if (scenarios[1].roi > 25 && riskScore < 40) recs.push('✅ Strong ROI with manageable risk. Lock in input costs early.');
      if (!_insurance && scenarios[0].profit < -totalInvestment * 0.3) recs.push('⚠️ Without insurance a bad season could mean 30%+ loss. Consider PM-FASAL Bima.');
      if (recs.length === 0) recs.push(`✅ Setup looks viable. Expected profit: ₹${Math.round(scenarios[1].profit).toLocaleString()}.`);
      setSimResults({ crop, areaNum, scenarios, totalCost, insuranceCost, totalInvestment, riskScore, breakEvenYield, breakEvenPct, costBreakdown, avgPrice, recommendations: recs });
      setSimLoading(false); setSimTab('results');
    }, 1200);
  };

  // Local AI generation
  const generateResultsFromAnswers = (answers: Record<string, string>) => {
    const { budget, water_source, experience, goal, labour } = answers;
    const critiqueParts: string[] = [];
    if (water_source === 'rain') critiqueParts.push('Your farm relies on rainwater. Consider low-cost water storage like a farm pond.');
    if (budget === 'low') critiqueParts.push('Budget is limited — avoid high-input crops like cotton this season.');
    if (experience === 'beginner') critiqueParts.push('As a newer farmer, start with 1–2 familiar crops.');
    if (labour === 'self') critiqueParts.push('With only family labour, choose crops that need less daily attention.');
    const critique = critiqueParts.length > 0 ? critiqueParts.join(' ') : 'Your farm setup looks solid. Recommendations below are optimized for your inputs.';
    type Sug = { zone: string; title: string; description: string; action: string; score: number; metrics: { yield: string; profit: string } };
    const suggestions: Sug[] = [];
    if (goal === 'profit') {
      if (budget === 'very_high' && water_source !== 'rain') {
        suggestions.push({ zone: 'Primary Zone', title: 'Plant Cash Crops — Tomato or Capsicum', description: 'With good water access and strong budget, high-value vegetables can give 3–5x returns.', action: 'Allocate 70% land to tomato/capsicum, 30% to maize as backup.', score: 91, metrics: { yield: 'High (8–12 tonnes/acre)', profit: '₹80,000–₹1,50,000' } });
      } else if (budget === 'medium' || budget === 'high') {
        suggestions.push({ zone: 'Primary Zone', title: 'Grow Hybrid Maize or Sunflower', description: 'Good market demand with moderate water needs.', action: 'Buy certified hybrid seeds, apply balanced NPK at sowing.', score: 78, metrics: { yield: 'Moderate (4–6 tonnes/acre)', profit: '₹30,000–₹60,000' } });
        suggestions.push({ zone: 'Secondary Zone', title: 'Intercrop with Pulses (Moong/Urad)', description: 'Pulses fix nitrogen naturally reducing fertilizer cost next season.', action: 'Sow moong between maize rows at 30cm spacing.', score: 74, metrics: { yield: 'Low–Moderate (1–2 tonnes/acre)', profit: '₹10,000–₹20,000' } });
      } else {
        suggestions.push({ zone: 'Primary Zone', title: 'Focus on One Low-Cost Grain Crop', description: 'Jowar or ragi need little water, few inputs, sell well locally.', action: 'Grow jowar on full plot and sell surplus at nearest APMC mandi.', score: 68, metrics: { yield: 'Low–Moderate (2–4 tonnes/acre)', profit: '₹8,000–₹18,000' } });
      }
    } else if (goal === 'subsistence') {
      suggestions.push({ zone: 'Primary Zone', title: 'Rice/Wheat Mix + Vegetables', description: 'Plant staple grain on 60% and use rest for household vegetables.', action: 'Reserve 0.5 acre for kitchen garden.', score: 80, metrics: { yield: 'Moderate', profit: '₹12,000–₹25,000 (surplus)' } });
    } else if (goal === 'experiment') {
      suggestions.push({ zone: 'Primary Zone', title: 'Try Quinoa or Chia Seeds', description: 'Strong urban/export demand. Grows well in dry conditions.', action: 'Start with 0.5 acre trial. Source seeds from KVK.', score: 70, metrics: { yield: 'Low (0.5–1 tonne/acre)', profit: '₹15,000–₹40,000 (premium)' } });
    } else {
      suggestions.push({ zone: 'Primary Zone', title: 'Low-Input Millet Crops', description: 'Bajra and ragi need almost no irrigation. MSP ensures fair buyer.', action: 'Apply one dose DAP at sowing. Skip pesticides.', score: 82, metrics: { yield: 'Moderate (2–3 tonnes/acre)', profit: '₹10,000–₹20,000' } });
    }
    return { suggestions, critique };
  };

  const startAiConsultation = () => { setAiAnswers({}); setAiState('questions'); };
  const submitAiAnswers = () => {
    setLoadingAI(true);
    setTimeout(() => {
      const { suggestions, critique } = generateResultsFromAnswers(aiAnswers);
      setAiSuggestions(suggestions); setAiCritique(critique); setAiState('results'); setLoadingAI(false);
    }, 1800);
  };

  // Crop Doctor
  const diagnoseCrop = () => {
    if (!selectedCrop || !selectedSymptom) { setDiagnosisResult('Please select crop and symptom.'); return; }
    if (selectedCrop === 'Cotton' && selectedSymptom === 'Yellow Leaves') setDiagnosisResult('Possible Nitrogen Deficiency. Apply urea 25kg/acre and irrigate properly.');
    else if (selectedCrop === 'Wheat' && selectedSymptom === 'Brown Spots') setDiagnosisResult('Possible Leaf Rust Disease. Spray recommended fungicide immediately.');
    else setDiagnosisResult('Disease not clearly identified. Please consult an agriculture officer.');
  };

  // Community helpers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setNewPostImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setNewPostImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  const handleSubmitPost = () => {
    if (!newPostText.trim()) return; setIsPosting(true);
    setTimeout(() => {
      const post = { id: Date.now(), author: farm?.name || 'You', avatar: 'https://picsum.photos/seed/farmer/100/100', location: farm?.location || '', time: 'Just now', text: newPostText.trim(), image: newPostImage || undefined, tag: newPostTag, likes: 0, likedByMe: false, comments: [], showComments: false };
      setPosts(prev => [post, ...prev]); setNewPostText(''); setNewPostImage(null); setNewPostImageName(''); setNewPostTag('General'); setIsPosting(false);
    }, 800);
  };
  const toggleLike = (id: number) => setPosts(prev => prev.map(p => p.id === id ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 } : p));
  const toggleComments = (id: number) => setPosts(prev => prev.map(p => p.id === id ? { ...p, showComments: !p.showComments } : p));
  const submitComment = (id: number) => {
    const text = commentDrafts[id]?.trim(); if (!text) return;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, comments: [...p.comments, { author: farm?.name || 'You', avatar: 'https://picsum.photos/seed/farmer/100/100', text }] } : p));
    setCommentDrafts(prev => ({ ...prev, [id]: '' }));
  };


  const fetchFarmData = async () => {
    try {
      const res = await fetch('/api/farm');
      const data = await res.json();
      setFarm(data);
      if (data) { fetchWeather(data.latitude, data.longitude); fetchMarket(); }
    } catch (e) {
      console.error('Failed to fetch farm data', e);
      try {
        const cached = localStorage.getItem('kissan_farm');
        if (cached) { const p = JSON.parse(cached); setFarm(p); if (p.latitude && p.longitude) { fetchWeather(p.latitude, p.longitude); fetchMarket(); } }
      } catch (err) { console.error(err); }
    } finally { setLoading(false); }
  };

  const fetchSoilData = async () => {
    try { const res = await fetch('/api/soil'); const data = await res.json(); setSoil(data); } catch (e) { console.error(e); }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try { const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`); const data = await res.json(); setWeather(data); } catch (e) { console.error(e); }
  };

  const fetchMarket = async () => {
    try { const res = await fetch('/api/market'); const data = await res.json(); setMarket(data); } catch (e) { console.error(e); }
  };

  const fetchCalendar = async () => {
    try { const res = await fetch('/api/calendar'); const data = await res.json(); setCalendar(data); } catch (e) { console.error(e); }
  };

  const fetchSubsidies = async () => {
    try { const res = await fetch('/api/subsidies'); const data = await res.json(); setSubsidies(data); } catch (e) { console.error(e); }
  };

  const fetchAiFinance = async () => {
    if (!farm || !weather) return;
    try {
      const res = await fetch('/api/ai/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ farm, weather }) });
      const data = await res.json(); setFinanceData(data);
    } catch (e) { console.error(e); }
  };

  const scheduleIrrigation = async (zoneId: number) => {
    try {
      const res = await fetch(`/api/zone/${zoneId}/schedule-irrigation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) { const body = await res.json(); setFarm(prev => prev ? { ...prev, zones: prev.zones.map((z: any) => z.id === body.zone.id ? body.zone : z) } as any : prev); setSelectedZone((sz: any) => sz && sz.id === body.zone.id ? body.zone : sz); }
    } catch (e) { console.error(e); }
  };

  const logHarvest = async (zoneId: number) => {
    try {
      const res = await fetch(`/api/zone/${zoneId}/log-harvest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) { const body = await res.json(); setFarm(prev => prev ? { ...prev, zones: prev.zones.map((z: any) => z.id === body.zone.id ? body.zone : z) } as any : prev); setSelectedZone((sz: any) => sz && sz.id === body.zone.id ? body.zone : sz); }
    } catch (e) { console.error(e); }
  };

  const handleCreateFarm = async (data: any) => {
    try {
      const res = await fetch('/api/farm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { fetchFarmData(); }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-green-600">Loading Kissan and Co...</div>;
  if (!farm) return <LandForm onSubmit={handleCreateFarm} />;

  return (
    <div className="flex h-screen bg-[#F2F4F1] overflow-hidden font-sans text-gray-900 selection:bg-green-100 selection:text-green-900">

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? 280 : 88,
          x: 0
        }}
        className={`bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 shadow-xl shadow-gray-200/50
          fixed inset-y-0 left-0 h-full md:relative
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 flex items-center gap-4 justify-between md:justify-start">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30 shrink-0">
              <Sprout size={22} strokeWidth={2.5} />
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="font-display font-bold text-xl tracking-tight text-gray-900 leading-none">Kissan.ai</span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">Intelligence</span>
              </motion.div>
            )}
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-8 mt-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Main Group */}
          <div className="space-y-1.5">
            {(isSidebarOpen || isMobileMenuOpen) && <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Dashboard</p>}
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
              { id: 'community', icon: Users, label: 'Community' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                  ${activeTab === item.id
                    ? 'bg-green-50 text-green-700 shadow-sm ring-1 ring-green-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                {activeTab === item.id && <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-r-full" />}
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={`min-w-[20px] transition-colors ${activeTab === item.id ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {(isSidebarOpen || isMobileMenuOpen) && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Intelligence Group */}
          <div className="space-y-1.5">
            {(isSidebarOpen || isMobileMenuOpen) && <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Intelligence</p>}
            {[
              { id: 'ai-suggestions', icon: BrainCircuit, label: 'AI Advisor' },
              { id: 'simulator', icon: Activity, label: 'Simulator' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                  ${activeTab === item.id
                    ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-100'
                    : 'text-gray-500 hover:bg-purple-50/50 hover:text-purple-700'
                  }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                {activeTab === item.id && <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-r-full" />}
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={`min-w-[20px] transition-colors ${activeTab === item.id ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500'}`} />
                {(isSidebarOpen || isMobileMenuOpen) && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Finance Group */}
          <div className="space-y-1.5">
            {(isSidebarOpen || isMobileMenuOpen) && <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Business</p>}
            {[
              { id: 'finance', icon: DollarSign, label: 'Financials' },
              { id: 'market', icon: Store, label: 'Marketplace' },
              { id: 'subsidies', icon: FileText, label: 'Subsidies' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                  ${activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                    : 'text-gray-500 hover:bg-blue-50/50 hover:text-blue-700'
                  }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                {activeTab === item.id && <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />}
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={`min-w-[20px] transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                {(isSidebarOpen || isMobileMenuOpen) && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Help Group */}
          <div className="space-y-1.5">
            {(isSidebarOpen || isMobileMenuOpen) && <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{'Help'}</p>}
            {[
              { id: 'community', icon: Users, label: 'Community', color: 'pink' },
              { id: 'diagnosis', icon: Leaf, label: 'Crop Doctor', color: 'teal' },
              { id: 'tutorial', icon: FileText, label: 'Tutorial', color: 'yellow' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                  ${activeTab === item.id
                    ? 'bg-yellow-50 text-yellow-700 shadow-sm ring-1 ring-yellow-100'
                    : 'text-gray-500 hover:bg-yellow-50/50 hover:text-yellow-700'
                  }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                {activeTab === item.id && <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-r-full" />}
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={`min-w-[20px] transition-colors ${activeTab === item.id ? 'text-yellow-600' : 'text-gray-400 group-hover:text-yellow-500'}`} />
                {(isSidebarOpen || isMobileMenuOpen) && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 hidden md:block">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-600 hover:shadow-sm transition-all"
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F2F4F1]">
        {/* Top Bar */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-between px-4 md:px-8 z-20 sticky top-0">
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-display font-bold text-gray-900 capitalize tracking-tight">
              {activeTab.replace('-', ' ')}
            </h1>
            <div className="hidden md:block h-8 w-px bg-gray-200"></div>
            <div className="hidden md:flex items-center gap-3 text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm group cursor-pointer hover:border-green-200 transition-colors" onClick={() => setIsEditingFarm(true)}>
              <MapPin size={16} className="text-green-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{farm.location}</span>
              <span className="text-xs text-green-600 font-bold ml-1 opacity-0 group-hover:opacity-100 transition-opacity">EDIT</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-8">

            {weather?.current && (
              <div className="flex items-center gap-4 pl-6 md:border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{'Temperature'}</p>
                  <p className="text-base font-bold text-gray-900">{Math.round(weather.current.temp_c)}°C</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                  {weather.current.condition.text.includes('Rain') ? <CloudRain size={20} className="md:w-6 md:h-6" /> : <Sun size={20} className="text-orange-500 md:w-6 md:h-6" />}
                </div>
              </div>
            )}

            <div className="relative">
              <button onClick={() => setShowAlerts(!showAlerts)} className="relative p-3 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-gray-100">
                <Bell size={22} className="text-gray-500" />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
              </button>

              <AnimatePresence>
                {showAlerts && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden ring-1 ring-black/5"
                  >
                    <div className="p-5 bg-gray-50/80 backdrop-blur border-b border-gray-100 flex justify-between items-center">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                        {'Notifications'}
                      </h4>
                      <button onClick={() => setShowAlerts(false)}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      <div className="p-5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                        <div className="flex gap-4">
                          <div className="mt-1 p-2 bg-blue-100 text-blue-600 rounded-xl h-fit"><CloudRain size={16} /></div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{'Heavy Rain Alert'}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{'Expected tomorrow - cover vulnerable crops.'}</p>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">2 {'h ago'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex gap-4">
                          <div className="mt-1 p-2 bg-orange-100 text-orange-600 rounded-xl h-fit"><Activity size={16} /></div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{'Pest Warning'}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{'Aphid activity detected in Zone 3.'}</p>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">5 {'h ago'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-md overflow-hidden">
              <img src="https://picsum.photos/seed/farmer/200/200" alt="Profile" className="w-full h-full object-cover" />
            </div>

          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
          {activeTab === 'overview' ? (
            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">

              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                  label={'Est. Revenue'}
                  value={financeData?.financials?.projected_revenue ? `₹${financeData.financials.projected_revenue.min.toLocaleString()}` : '...'}
                  icon={TrendingUp}
                  trend="+8%"
                  trendUp={true}
                />
                <StatCard
                  label={'Irrigation Cost'}
                  value={financeData?.irrigation?.monthly_forecast ? `₹${financeData.irrigation.monthly_forecast.toLocaleString()}${'/mo'}` : '...'}
                  icon={Droplets}
                  trend={financeData ? 'Projected' : ''}
                  trendUp={false}
                />
                <StatCard
                  label={'Soil Health'}
                  value={soil ? soil.nitrogen : 'Loading...'}
                  icon={Leaf}
                />
                <StatCard
                  label={'Active Zones'}
                  value={farm.zones.filter(z => z.status === 'Active').length}
                  icon={Sprout}
                />
              </div>

              {/* Main Layout: Map + Insights */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 min-h-[700px]">

                {/* Farm Map (Hero) */}
                <div className="xl:col-span-2 flex flex-col h-[500px] md:h-full bg-white rounded-[2rem] shadow-card border border-gray-100 p-4 md:p-8 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6 md:mb-8 z-10">
                    <div>
                      <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900">{'Farm Visualization'}</h2>
                      <p className="text-sm md:text-base text-gray-500 mt-1">{'Real-time Monitoring'}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-100 shadow-sm font-semibold">Visualization</span>
                      <span className="text-xs text-gray-400">Simplified view focused on zones</span>
                    </div>
                  </div>
                  <div className="flex-1 relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                    <FarmMap
                      zones={farm.zones}
                      area={farm.area}
                      onSelectZone={setSelectedZone}
                      selectedZoneId={selectedZone?.id}
                      mode={'2d'}
                    />
                  </div>
                </div>

                {/* Right Panel: Insights */}
                <div className="space-y-6 flex flex-col h-full">

                  {/* Weather Card */}
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none relative overflow-hidden shadow-lg shadow-blue-500/20">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><CloudRain size={120} /></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">{'Current Weather'}</p>
                          <h3 className="text-5xl font-display font-bold">{weather?.current ? Math.round(weather.current.temp_c) : '--'}°</h3>
                          <p className="text-blue-50 font-medium mt-2 capitalize flex items-center gap-2">
                            {weather?.current ? weather.current.condition.text : '--'}
                          </p>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur rounded-2xl">
                          <Sun size={32} className="text-yellow-300" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                          <Wind size={20} className="mb-2 opacity-80" />
                          <p className="text-xs text-blue-100 uppercase tracking-wider font-bold">{''}</p>
                          <p className="font-bold text-lg">{weather?.current ? weather.current.wind_kph : '--'} <span className="text-xs font-normal">km/h</span></p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                          <Droplets size={20} className="mb-2 opacity-80" />
                          <p className="text-xs text-blue-100 uppercase tracking-wider font-bold">{''}</p>
                          <p className="font-bold text-lg">{weather?.current ? weather.current.humidity : '--'}%</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Soil Health Card */}
                  <Card className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Leaf size={20} /></div>
                        {'Soil Health'}
                      </h3>
                      <span className="text-[10px] bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-green-100">{''}</span>
                    </div>
                    {soil ? (
                      <div className="space-y-6 flex-1">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                          <span className="text-sm text-gray-500 font-medium">{''}</span>
                          <span className="font-bold text-gray-900 text-lg">{soil.ph} <span className="text-xs text-gray-400 font-normal ml-1">({''})</span></span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                          <span className="text-sm text-gray-500 font-medium">{''}</span>
                          <span className="font-bold text-gray-900 text-lg">{soil.moisture}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-auto">
                          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{''}</p>
                            <p className="font-bold text-gray-900">{soil.nitrogen}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{''}</p>
                            <p className="font-bold text-gray-900">{soil.phosphorus}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{''}</p>
                            <p className="font-bold text-gray-900">{soil.potassium}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">{'Loading...'}</div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          ) : activeTab === 'simulator' ? (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><Activity size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Risk-Aware Farm Strategy Simulator</h2>
                  <p className="text-gray-500 text-sm">Model crop economics before sowing. See profit/loss across 3 scenarios.</p>
                </div>
              </div>
              {simTab === 'setup' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-5">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Sprout size={18} className="text-emerald-500" /> Crop & Scale</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Crop</label>
                          <select value={simCrop} onChange={e => setSimCrop(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                            {Object.entries(CROP_PROFILES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Area (acres)</label>
                          <input type="number" min="0.5" max="100" step="0.5" value={simArea} onChange={e => setSimArea(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">{CROP_PROFILES[simCrop].name}</span> · {CROP_PROFILES[simCrop].season} · {CROP_PROFILES[simCrop].growthDays} days to harvest
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CloudRain size={18} className="text-blue-500" /> Weather & Market</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {(['low', 'normal', 'high'] as const).map(r => (
                          <button key={r} onClick={() => setSimRainfall(r)} className={`p-3 rounded-xl border-2 text-sm font-medium text-center transition-all ${simRainfall === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-blue-200 text-gray-600'}`}>
                            {r === 'low' ? '🌵' : r === 'normal' ? '🌧' : '🌦'} {r.charAt(0).toUpperCase() + r.slice(1)} Rain
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {(['bearish', 'normal', 'bullish'] as const).map(m => (
                          <button key={m} onClick={() => setSimMarket2(m)} className={`p-3 rounded-xl border-2 text-sm font-medium text-center transition-all ${simMarket2 === m ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 hover:border-purple-200 text-gray-600'}`}>
                            {m === 'bearish' ? '📉 Bearish' : m === 'normal' ? '📊 Normal' : '📈 Bullish'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Droplets size={18} className="text-cyan-500" /> Farming Practice</h3>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {(['rainfed', 'partial', 'full'] as const).map(i => (
                          <button key={i} onClick={() => setSimIrrigation(i)} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${simIrrigation === i ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-100 hover:border-cyan-200 text-gray-600'}`}>
                            {i === 'rainfed' ? '💧 Rainfed' : i === 'partial' ? '🚿 Partial' : '🌊 Full Irrig.'}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {(['none', 'basic', 'intensive'] as const).map(p => (
                          <button key={p} onClick={() => setSimPestControl(p)} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${simPestControl === p ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-orange-200 text-gray-600'}`}>
                            {p === 'none' ? '🚫 None' : p === 'basic' ? '🌿 Basic' : '🔬 Intensive'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-4">Risk Protection</h3>
                      <button onClick={() => setSimHasInsurance(!simHasInsurance)} className={`w-full p-4 rounded-xl border-2 text-sm font-medium transition-all text-left ${simHasInsurance ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${simHasInsurance ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                            {simHasInsurance && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">PM-Fasal Bima Yojana</p>
                            <p className="text-xs text-gray-500 mt-0.5">4.5% premium · Caps losses at 30%</p>
                          </div>
                        </div>
                      </button>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-3">Quick Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Crop</span><span className="font-semibold">{CROP_PROFILES[simCrop].emoji} {CROP_PROFILES[simCrop].name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="font-semibold">{simArea} acres</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Season</span><span className="font-semibold text-xs">{CROP_PROFILES[simCrop].season}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Rainfall</span><span className="font-semibold capitalize">{simRainfall}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Market</span><span className="font-semibold capitalize">{simMarket2}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Pest Control</span><span className="font-semibold capitalize">{simPestControl}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Irrigation</span><span className="font-semibold capitalize">{simIrrigation}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Insurance</span><span className={`font-semibold ${simHasInsurance ? 'text-emerald-600' : 'text-red-500'}`}>{simHasInsurance ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>
                    <button onClick={runSimulation} disabled={simLoading} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-60">
                      {simLoading ? 'Simulating...' : '🚀 Run Simulation'}
                    </button>
                  </div>
                </div>
              ) : simResults && (
                <div className="space-y-6">
                  <div className="flex gap-3">
                    <button onClick={() => setSimTab('setup')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"><ChevronLeft size={16} /> Back to Setup</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {simResults.scenarios.map((s: any) => (
                      <div key={s.label} className={`rounded-2xl p-5 border-2 ${s.bgColor} ${s.border}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-sm font-bold ${s.text}`}>{s.icon} {s.label}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${s.bgColor} ${s.text} border ${s.border}`}>{s.roi.toFixed(0)}% ROI</span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Yield</span><span className="font-semibold">{s.yield.toFixed(1)} q</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Revenue</span><span className="font-semibold">₹{Math.round(s.revenue).toLocaleString()}</span></div>
                          <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5"><span className="text-gray-600 font-medium">Profit</span><span className={`font-bold text-base ${s.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₹{Math.round(s.profit).toLocaleString()}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">💡 Recommendations</h3>
                    <ul className="space-y-2">
                      {simResults.recommendations.map((r: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2"><span className="mt-0.5 min-w-[6px] h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2"></span>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'community' ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Users size={20} className="text-pink-500" /> Farmer Community</h2>
                <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} rows={3} placeholder="Share news, tips, or ask a question..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300" />
                <div className="flex items-center gap-3 mt-3">
                  <select value={newPostTag} onChange={e => setNewPostTag(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                    {['General', 'Crop Health', 'Success Story', 'Weather Alert', 'Question', 'Market Tip'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                    📷 Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {newPostImageName && <span className="text-xs text-gray-400 truncate max-w-[120px]">{newPostImageName}</span>}
                  <button onClick={handleSubmitPost} disabled={isPosting || !newPostText.trim()} className="ml-auto px-5 py-2 bg-pink-500 text-white font-semibold rounded-xl text-sm hover:bg-pink-600 disabled:opacity-50 transition-colors">
                    {isPosting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{post.author}</span>
                          <span className="text-xs text-gray-400">{post.location}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{post.time}</span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 font-semibold border border-pink-100">{post.tag}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{post.text}</p>
                      </div>
                    </div>
                    {post.image && <img src={post.image} alt="post" className="w-full object-cover rounded-xl mb-3 max-h-64" />}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 transition-colors ${post.likedByMe ? 'text-red-500' : 'hover:text-red-400'}`}>
                        <span>{post.likedByMe ? '❤️' : '🤍'}</span> {post.likes}
                      </button>
                      <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                        💬 {post.comments.length}
                      </button>
                    </div>
                  </div>
                  {post.showComments && (
                    <div className="border-t border-gray-50 px-5 pb-4 bg-gray-50/50">
                      {post.comments.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 mt-3">
                          <img src={c.avatar} alt={c.author} className="w-7 h-7 rounded-full" />
                          <div className="bg-white rounded-xl px-3 py-2 text-xs shadow-sm border border-gray-100">
                            <span className="font-semibold text-gray-800">{c.author}</span>
                            <span className="text-gray-600 ml-1">{c.text}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-3">
                        <input value={commentDrafts[post.id] || ''} onChange={e => setCommentDrafts(p => ({ ...p, [post.id]: e.target.value }))} placeholder="Add a comment..." className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-300" onKeyDown={e => { if (e.key === 'Enter') { submitComment(post.id); e.preventDefault(); } }} />
                        <button onClick={() => submitComment(post.id)} className="px-3 py-1.5 bg-pink-500 text-white rounded-xl text-xs font-semibold">Send</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : activeTab === 'ai-suggestions' ? (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-100 rounded-2xl text-purple-600 shadow-sm">
                  <BrainCircuit size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900">{''}</h2>
                  <p className="text-gray-500">{''}</p>
                </div>
              </div>

              {aiState === 'initial' && (
                <Card className="text-center py-16 px-8 max-w-2xl mx-auto border-dashed border-2 border-gray-200 shadow-none bg-gray-50/50">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                    <Sparkles size={32} className="text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">{''}</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    {''}
                  </p>
                  <button
                    onClick={startAiConsultation}
                    disabled={loadingAI}
                    className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-95"
                  >
                    {loadingAI ? '' : ''}
                  </button>
                </Card>
              )}

              {aiState === 'questions' && (
                <Card className="max-w-2xl mx-auto overflow-hidden">
                  <div className="bg-purple-50 p-6 border-b border-purple-100">
                    <h3 className="text-lg font-bold text-purple-900">Quick Farm Assessment</h3>
                    <p className="text-purple-700 text-sm mt-1">Answer a few questions to get personalised crop advice.</p>
                  </div>
                  <div className="p-8 space-y-6">
                    {[
                      { id: 'budget', text: 'What is your budget for this season?', options: ['low', 'medium', 'high', 'very_high'] },
                      { id: 'water_source', text: 'What is your primary water source?', options: ['canal', 'borewell', 'river', 'rain'] },
                      { id: 'experience', text: 'How many years of farming experience do you have?', options: ['beginner', '1-3 years', '4-10 years', '10+ years'] },
                      { id: 'goal', text: 'What is your primary farming goal?', options: ['profit', 'subsistence', 'water_saving', 'experiment'] },
                      { id: 'labour', text: 'What labour do you have available?', options: ['self', 'family', 'hired', 'all'] },
                    ].map((q) => (
                      <div key={q.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{q.text}</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="Type your answer here..."
                          onChange={(e) => setAiAnswers({ ...aiAnswers, [q.id]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div className="pt-4">
                      <button
                        onClick={submitAiAnswers}
                        disabled={loadingAI}
                        className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
                      >
                        {loadingAI ? '' : ''}
                      </button>
                    </div>
                  </div>
                </Card>
              )}

              {aiState === 'results' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Critique & Actions */}
                  <div className="lg:col-span-2 space-y-6">
                    {aiCritique && (
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex gap-4">
                        <div className="mt-1 p-2 bg-red-100 text-red-600 rounded-lg h-fit"><ArrowUpRight size={20} className="rotate-180" /></div>
                        <div>
                          <h4 className="font-bold text-red-900 text-lg">{''}</h4>
                          <p className="text-red-800 mt-2 leading-relaxed">{aiCritique}</p>
                        </div>
                      </div>
                    )}

                    <h3 className="font-display font-bold text-xl text-gray-900 mt-8">{''}</h3>
                    <div className="space-y-4">
                      {aiSuggestions.map((suggestion, i) => (
                        <Card key={i} className="group hover:border-purple-200 transition-all duration-300">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-md border border-gray-200">
                                  {suggestion.zone}
                                </span>
                                <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-md border border-green-100">
                                  Score: {suggestion.score}/100
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{suggestion.title}</h3>
                              <p className="text-gray-600 mt-2 leading-relaxed">{suggestion.description}</p>

                              {suggestion.action && (
                                <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-100 inline-block">
                                  <p className="text-sm font-medium text-purple-900 flex items-center gap-2">
                                    <Sparkles size={16} className="text-purple-600" />
                                    Action: {suggestion.action}
                                  </p>
                                </div>
                              )}
                            </div>

                            {suggestion.metrics && (
                              <div className="ml-6 flex flex-col gap-2 min-w-[120px]">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Est. Yield</p>
                                  <p className="font-bold text-gray-900 mt-1">{suggestion.metrics.yield}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                                  <p className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Est. Profit</p>
                                  <p className="font-bold text-green-700 mt-1">{suggestion.metrics.profit}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Map Visualization */}
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
                      <h4 className="font-bold text-gray-900 mb-4">{''}</h4>
                      <div className="flex-1 relative rounded-2xl overflow-hidden border border-gray-100">
                        <FarmMap
                          zones={farm.zones}
                          area={farm.area}
                          onSelectZone={() => { }}
                        />
                        {/* Overlay for AI suggestion visualization could go here */}
                        <div className="absolute inset-0 bg-purple-900/5 pointer-events-none"></div>
                      </div>
                    </div>

                    <button
                      onClick={() => setAiState('initial')}
                      className="w-full py-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {'Start New Consultation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'finance' ? (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Projections</h2>
              {financeData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Projected Profit</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-green-700">₹{financeData.financials?.projected_profit?.min?.toLocaleString() || '0'}</span>
                      <span className="text-green-600 text-sm">to ₹{financeData.financials?.projected_profit?.max?.toLocaleString() || '0'}</span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">Confidence Score: {financeData.financials?.confidence_score || 0}%</p>
                  </Card>

                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Cost Invoice</h3>
                    <div className="space-y-3">
                      {financeData.invoice?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                          <span className="text-gray-600">{item.item}</span>
                          <span className="font-medium">₹{item.cost.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-lg">
                        <span>Total Est. Cost</span>
                        <span>₹{financeData.invoice?.reduce((acc: number, item: any) => acc + item.cost, 0).toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-20">Loading Financial Data...</div>
              )}
            </div>
          ) : activeTab === 'market' ? (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Farm-to-Table Marketplace</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {market.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-orange-500"
                    onClick={() => setSelectedMarket(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{item.type}</span>
                        </div>
                        <p className="text-sm text-gray-500">{item.distance} away • {item.demand} Demand</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-700">₹{item.price}</p>
                        <p className="text-xs text-gray-400">per quintal</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-orange-600 font-medium">
                      View Deal Details <ArrowUpRight size={16} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : activeTab === 'subsidies' ? (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 shadow-sm">
                  <FileText size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900">Government Subsidies</h2>
                  <p className="text-gray-500">Available schemes for your farm profile.</p>
                </div>
              </div>

              <div className="grid gap-6">
                {subsidies.map((scheme, i) => (
                  <Card key={i} className="group hover:border-blue-200 transition-all duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{scheme.name}</h3>
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-md border border-blue-100">Active</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{scheme.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-100 flex items-center gap-2">
                            <Users size={14} />
                            Eligibility: {scheme.eligibility}
                          </span>
                        </div>
                      </div>
                      <button className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm whitespace-nowrap">
                        Check Eligibility
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : activeTab === 'calendar' ? (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600 shadow-sm">
                  <CalendarIcon size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900">Farming Calendar</h2>
                  <p className="text-gray-500">Upcoming tasks and harvest windows.</p>
                </div>
              </div>

              <div className="grid gap-4">
                {calendar.map((event) => (
                  <Card key={event.id} className="flex items-center gap-6 p-4 hover:bg-gray-50/50 transition-colors group cursor-pointer border border-gray-100 hover:border-green-200 shadow-sm hover:shadow-md">
                    <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-transform group-hover:scale-105
                                ${event.type === 'planting' ? 'bg-green-50 border-green-100 text-green-700' :
                        event.type === 'harvest' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                          event.type === 'irrigation' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                            'bg-gray-50 border-gray-100 text-gray-700'}`}>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-70">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-2xl font-display font-bold">{new Date(event.date).getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">{event.task}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border
                                        ${event.type === 'planting' ? 'bg-green-50 text-green-700 border-green-100' :
                            event.type === 'harvest' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                              event.type === 'irrigation' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {event.type}
                        </span>
                        <span className="text-sm text-gray-400 font-medium">• Scheduled</span>
                      </div>
                    </div>
                    <button className="p-3 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all">
                      <ChevronRight size={24} />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          ) : activeTab === 'diagnosis' ? (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-100 rounded-lg text-teal-700"><Leaf size={24} /></div>
                <div><h2 className="text-2xl font-bold text-gray-900">Crop Doctor 🌿</h2><p className="text-gray-500 text-sm">Identify disease and get treatment advice.</p></div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Crop</label>
                  <select value={selectedCrop} onChange={e => setSelectedCrop(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">-- Choose crop --</option>
                    {['Wheat', 'Rice', 'Cotton', 'Maize', 'Tomato', 'Soybean'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Describe Symptom</label>
                  <select value={selectedSymptom} onChange={e => setSelectedSymptom(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    <option value="">-- Choose symptom --</option>
                    {['Yellow Leaves', 'Brown Spots', 'Wilting', 'White Powder', 'Holes in Leaves', 'Root Rot', 'Stunted Growth'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={diagnoseCrop} className="w-full py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition-colors">Diagnose</button>
                {diagnosisResult && (
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <p className="text-sm font-semibold text-teal-800 mb-1">Diagnosis Result</p>
                    <p className="text-sm text-teal-700">{diagnosisResult}</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'tutorial' ? (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📘 Getting Started with Kissan & Co</h2>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Set Up Your Farm', desc: 'Go to Overview and add your farm details including location, area, and irrigation type.', icon: '🗺️' },
                  { step: 2, title: 'Check Your Dashboard', desc: 'View your farm map, soil health, weather, and zone status in real-time.', icon: '📊' },
                  { step: 3, title: 'Get AI Crop Advice', desc: 'Visit the AI Advisor tab and answer a few questions to get personalised crop recommendations.', icon: '🤖' },
                  { step: 4, title: 'Run a Simulation', desc: 'Use the Simulator to model profit and risk for any crop before committing resources.', icon: '⚙️' },
                  { step: 5, title: 'Check Market Prices', desc: 'Visit the Marketplace tab to see live prices and find buyers near you.', icon: '🏪' },
                  { step: 6, title: 'Apply for Subsidies', desc: 'See all government schemes you are eligible for and apply directly.', icon: '📋' },
                  { step: 7, title: 'Diagnose Crop Disease', desc: 'Open Crop Doctor, select your crop and symptom to get instant diagnosis.', icon: '🌿' },
                  { step: 8, title: 'Join the Community', desc: 'Share your experience, ask questions and learn from other farmers.', icon: '👥' },
                ].map(item => (
                  <div key={item.step} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-5 items-start">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Step {item.step}</p>
                      <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Store size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Coming Soon</p>
              <p className="text-sm">This module is under development.</p>
            </div>
          )}
        </div>

        {/* Market Deal Modal */}
        <Modal
          isOpen={!!selectedMarket}
          onClose={() => setSelectedMarket(null)}
          title="Deal Analysis"
        >
          {selectedMarket && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">₹{selectedMarket.price}</h4>
                  <p className="text-sm text-gray-500">Offered Price per Quintal</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">High Profit Potential</p>
                  <p className="text-xs text-gray-400">Based on your production cost</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h5 className="font-semibold text-gray-900 mb-2">Buyer Profile</h5>
                  <p className="text-sm text-gray-600">{selectedMarket.name} is a {selectedMarket.type} buyer located {selectedMarket.distance} from your farm.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase">Transport Cost</p>
                    <p className="font-bold text-gray-900 mt-1">₹450</p>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase">Net Profit</p>
                    <p className="font-bold text-green-600 mt-1">₹{(selectedMarket.price - 450).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors">
                Accept Deal
              </button>
            </div>
          )}
        </Modal>

      </main>
      {/* Edit Farm Modal */}
      <Modal isOpen={isEditingFarm} onClose={() => setIsEditingFarm(false)} title="Edit Farm Details">
        <LandForm
          initialData={farm}
          onSubmit={async (data) => {
            const res = await fetch('/api/farm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            const updatedFarm = await res.json();
            if (updatedFarm.status === 'success') {
              // Refresh farm data
              const farmRes = await fetch('/api/farm');
              const farmData = await farmRes.json();
              setFarm(farmData);
              setIsEditingFarm(false);
            }
          }}
        />
      </Modal>

      {/* Zone Details Modal */}
      <Modal isOpen={!!selectedZone} onClose={() => setSelectedZone(null)} title={selectedZone?.name || 'Zone Details'}>
        {selectedZone && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm">
                  <Sprout size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Current Crop</p>
                  <h4 className="text-xl font-bold text-gray-900">{selectedZone.crop || 'Fallow'}</h4>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${selectedZone.status === 'Active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                {selectedZone.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Area Size</p>
                <p className="text-lg font-bold text-gray-900">{selectedZone.area} Acres</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Irrigation</p>
                <div className="flex items-center gap-2">
                  {selectedZone.waterAccess ? (
                    <>
                      <Droplets size={16} className="text-blue-500" />
                      <span className="text-lg font-bold text-gray-900">Connected</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-400">No Access</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-gray-900">Quick Actions</h5>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => selectedZone && scheduleIrrigation(selectedZone.id)} className="py-2.5 px-4 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors text-sm">
                  Schedule Irrigation
                </button>
                <button onClick={() => selectedZone && logHarvest(selectedZone.id)} className="py-2.5 px-4 bg-orange-50 text-orange-700 font-bold rounded-xl hover:bg-orange-100 transition-colors text-sm">
                  Log Harvest
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating multilingual voice assistant */}
      <VoiceAssistant lang="en" />
    </div >
  );
}
