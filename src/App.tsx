import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Sprout, CloudRain, TrendingUp, Store, 
  Settings, LogOut, MapPin, Bell, Search, Droplets, Wind, Sun, X, FileText,
  ChevronLeft, ChevronRight, Sparkles, BrainCircuit, DollarSign, ArrowUpRight, Users, Activity,
  Calendar as CalendarIcon, Leaf, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FarmMap } from './components/FarmMap';
import { Card, StatCard } from './components/ui/Card';
import { Modal } from './components/ui/Modal';
import { LandForm } from './components/LandForm';
import { FarmSimulator } from './components/FarmSimulator';
import { SocialFeed } from './components/SocialFeed';

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
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiCritique, setAiCritique] = useState<string>("");
  const [financeData, setFinanceData] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  
  // Market Modal
  const [selectedMarket, setSelectedMarket] = useState<any>(null);

  useEffect(() => {
    fetchFarmData();
    fetchSubsidies();
    fetchSoilData();
    fetchCalendar();
  }, []);

  const fetchSoilData = async () => {
    try {
      const res = await fetch('/api/soil');
      const data = await res.json();
      setSoil(data);
    } catch (e) { console.error(e); }
  };

  const fetchCalendar = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      setCalendar(data);
    } catch (e) { console.error(e); }
  };

  const fetchSubsidies = async () => {
    try {
      const res = await fetch('/api/subsidies');
      const data = await res.json();
      setSubsidies(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFarmData = async () => {
    try {
      const res = await fetch('/api/farm');
      const data = await res.json();
      setFarm(data);
      if (data) {
        fetchWeather(data.latitude, data.longitude);
        fetchMarket();
      }
    } catch (e) {
      console.error("Failed to fetch farm data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setWeather(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMarket = async () => {
    try {
      const res = await fetch('/api/market');
      const data = await res.json();
      setMarket(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAiFinance = async () => {
    if (!farm || !weather) return;
    // Only fetch finance background data, not suggestions yet
    try {
      const res = await fetch('/api/ai/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm, weather })
      });
      const data = await res.json();
      setFinanceData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const startAiConsultation = async () => {
    if (!farm || !weather) return;
    setLoadingAI(true);
    try {
        const res = await fetch('/api/ai/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ farm, weather, context: { step: 'initial' } })
        });
        const data = await res.json();
        if (data.type === 'question') {
            setAiQuestions(data.questions);
            setAiState('questions');
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingAI(false);
    }
  };

  const submitAiAnswers = async () => {
    setLoadingAI(true);
    try {
        const res = await fetch('/api/ai/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                farm, 
                weather, 
                context: { step: 'analyze', answers: aiAnswers } 
            })
        });
        const data = await res.json();
        if (data.type === 'result') {
            setAiSuggestions(data.suggestions);
            setAiCritique(data.critique);
            setAiState('results');
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingAI(false);
    }
  };

  // Trigger AI fetch when relevant tabs are selected
  useEffect(() => {
    if ((activeTab === 'finance' || activeTab === 'overview') && !financeData) {
      fetchAiFinance();
    }
  }, [activeTab, farm, weather]);

  const handleCreateFarm = async (data: any) => {
    try {
      const res = await fetch('/api/farm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchFarmData();
      }
    } catch (e) {
      console.error(e);
    }
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
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weather</p>
                  <p className="text-base font-bold text-gray-900">{Math.round(weather.current.temp_c)}°C, {weather.current.condition.text}</p>
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
                        Notifications
                      </h4>
                      <button onClick={() => setShowAlerts(false)}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      <div className="p-5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                        <div className="flex gap-4">
                           <div className="mt-1 p-2 bg-blue-100 text-blue-600 rounded-xl h-fit"><CloudRain size={16} /></div>
                           <div>
                              <p className="text-sm font-bold text-gray-900">Heavy Rain Alert</p>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Expected tomorrow at 2:00 PM. We recommend pausing scheduled irrigation for Zone A.</p>
                              <p className="text-[10px] text-gray-400 mt-2 font-medium">2 hours ago</p>
                           </div>
                        </div>
                      </div>
                      <div className="p-5 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex gap-4">
                           <div className="mt-1 p-2 bg-orange-100 text-orange-600 rounded-xl h-fit"><Activity size={16} /></div>
                           <div>
                              <p className="text-sm font-bold text-gray-900">Pest Warning: Zone B</p>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Aphid activity detected in neighboring farms (5km radius). Preventive spray recommended.</p>
                              <p className="text-[10px] text-gray-400 mt-2 font-medium">5 hours ago</p>
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
                  label="Est. Revenue" 
                  value={financeData?.financials?.projected_revenue ? `₹${financeData.financials.projected_revenue.min.toLocaleString()}` : '...'} 
                  icon={TrendingUp} 
                  trend="+8%" 
                  trendUp={true} 
                />
                <StatCard 
                  label="Irrigation Cost" 
                  value={financeData?.irrigation?.monthly_forecast ? `₹${financeData.irrigation.monthly_forecast.toLocaleString()}/mo` : '...'} 
                  icon={Droplets} 
                  trend={financeData ? 'Projected' : ''}
                  trendUp={false} 
                />
                <StatCard 
                  label="Soil Health" 
                  value={soil ? soil.nitrogen : 'Analyzing...'} 
                  icon={Leaf} 
                />
                <StatCard 
                  label="Active Zones" 
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
                        <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900">Farm Visualization</h2>
                        <p className="text-sm md:text-base text-gray-500 mt-1">Real-time zone monitoring & irrigation status</p>
                    </div>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                      <button className="px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg shadow-sm text-gray-800">2D Map</button>
                      <button className="px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hidden sm:block">Satellite</button>
                    </div>
                  </div>
                  <div className="flex-1 relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                    <FarmMap 
                        zones={farm.zones} 
                        area={farm.area} 
                        onSelectZone={setSelectedZone}
                        selectedZoneId={selectedZone?.id}
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
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Current Weather</p>
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
                                <p className="text-xs text-blue-100 uppercase tracking-wider font-bold">Wind</p>
                                <p className="font-bold text-lg">{weather?.current ? weather.current.wind_kph : '--'} <span className="text-xs font-normal">km/h</span></p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                                <Droplets size={20} className="mb-2 opacity-80" />
                                <p className="text-xs text-blue-100 uppercase tracking-wider font-bold">Humidity</p>
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
                            Soil Health
                        </h3>
                        <span className="text-[10px] bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-green-100">Updated today</span>
                    </div>
                    {soil ? (
                        <div className="space-y-6 flex-1">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                <span className="text-sm text-gray-500 font-medium">pH Level</span>
                                <span className="font-bold text-gray-900 text-lg">{soil.ph} <span className="text-xs text-gray-400 font-normal ml-1">(Neutral)</span></span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                                <span className="text-sm text-gray-500 font-medium">Moisture</span>
                                <span className="font-bold text-gray-900 text-lg">{soil.moisture}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-auto">
                                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Nitrogen</p>
                                    <p className="font-bold text-gray-900">{soil.nitrogen}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Phosphorus</p>
                                    <p className="font-bold text-gray-900">{soil.phosphorus}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Potassium</p>
                                    <p className="font-bold text-gray-900">{soil.potassium}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading soil data...</div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          ) : activeTab === 'simulator' ? (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <Activity size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Risk-Aware Farm Strategy</h2>
                  <p className="text-gray-500 text-sm">Simulate uncertainty before sowing and compare survival outcomes.</p>
                </div>
              </div>
              <FarmSimulator farm={farm} />
            </div>
          ) : activeTab === 'community' ? (
            <SocialFeed />
          ) : activeTab === 'ai-suggestions' ? (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-100 rounded-2xl text-purple-600 shadow-sm">
                  <BrainCircuit size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900">AI Farm Advisor</h2>
                  <p className="text-gray-500">Interactive consultation for optimized farming.</p>
                </div>
              </div>

              {aiState === 'initial' && (
                <Card className="text-center py-16 px-8 max-w-2xl mx-auto border-dashed border-2 border-gray-200 shadow-none bg-gray-50/50">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                    <Sparkles size={32} className="text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">Start Your Farm Consultation</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    Our AI will analyze your farm's specific conditions (Soil, Weather, Zones) and ask a few questions to tailor recommendations.
                  </p>
                  <button 
                    onClick={startAiConsultation}
                    disabled={loadingAI}
                    className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-95"
                  >
                    {loadingAI ? 'Initializing...' : 'Start Analysis'}
                  </button>
                </Card>
              )}

              {aiState === 'questions' && (
                <Card className="max-w-2xl mx-auto overflow-hidden">
                  <div className="bg-purple-50 p-6 border-b border-purple-100">
                    <h3 className="text-lg font-bold text-purple-900">We need a few details...</h3>
                    <p className="text-purple-700 text-sm mt-1">Help us tailor the plan to your resources.</p>
                  </div>
                  <div className="p-8 space-y-6">
                    {aiQuestions.map((q: any) => (
                      <div key={q.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{q.text}</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="Type your answer here..."
                          onChange={(e) => setAiAnswers({...aiAnswers, [q.id]: e.target.value})}
                        />
                      </div>
                    ))}
                    <div className="pt-4">
                        <button 
                        onClick={submitAiAnswers}
                        disabled={loadingAI}
                        className="w-full py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
                        >
                        {loadingAI ? 'Generating Plan...' : 'Get Recommendations'}
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
                                <div className="mt-1 p-2 bg-red-100 text-red-600 rounded-lg h-fit"><LogOut size={20} className="rotate-180" /></div>
                                <div>
                                    <h4 className="font-bold text-red-900 text-lg">Current Analysis</h4>
                                    <p className="text-red-800 mt-2 leading-relaxed">{aiCritique}</p>
                                </div>
                            </div>
                        )}

                        <h3 className="font-display font-bold text-xl text-gray-900 mt-8">Recommended Strategy</h3>
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
                            <h4 className="font-bold text-gray-900 mb-4">Proposed Layout</h4>
                            <div className="flex-1 relative rounded-2xl overflow-hidden border border-gray-100">
                                <FarmMap 
                                    zones={farm.zones} 
                                    area={farm.area} 
                                    onSelectZone={() => {}}
                                />
                                {/* Overlay for AI suggestion visualization could go here */}
                                <div className="absolute inset-0 bg-purple-900/5 pointer-events-none"></div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setAiState('initial')}
                            className="w-full py-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Start New Consultation
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
                        <button className="py-2.5 px-4 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors text-sm">
                            Schedule Irrigation
                        </button>
                        <button className="py-2.5 px-4 bg-orange-50 text-orange-700 font-bold rounded-xl hover:bg-orange-100 transition-colors text-sm">
                            Log Harvest
                        </button>
                    </div>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
}
