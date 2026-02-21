import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Wind, Droplets, Thermometer, ArrowRight, TrendingUp, AlertTriangle, CloudRain } from 'lucide-react';

interface FarmSimulatorProps {
  farm: any;
}

export function FarmSimulator({ farm }: FarmSimulatorProps) {
  const [conditions, setConditions] = useState({
    temp: 28,
    rain: 50,
    humidity: 60
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm, conditions })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Controls */}
      <Card className="lg:col-span-1 h-fit">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Condition Simulator</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Thermometer size={16} /> Temperature
              </label>
              <span className="text-sm font-bold text-blue-600">{conditions.temp}°C</span>
            </div>
            <input 
              type="range" min="0" max="50" 
              value={conditions.temp}
              onChange={(e) => setConditions({...conditions, temp: Number(e.target.value)})}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CloudRain size={16} /> Rainfall
              </label>
              <span className="text-sm font-bold text-blue-600">{conditions.rain}mm</span>
            </div>
            <input 
              type="range" min="0" max="500" 
              value={conditions.rain}
              onChange={(e) => setConditions({...conditions, rain: Number(e.target.value)})}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Droplets size={16} /> Humidity
              </label>
              <span className="text-sm font-bold text-blue-600">{conditions.humidity}%</span>
            </div>
            <input 
              type="range" min="0" max="100" 
              value={conditions.humidity}
              onChange={(e) => setConditions({...conditions, humidity: Number(e.target.value)})}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <button 
            onClick={runSimulation}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      </Card>

      {/* Results */}
      <div className="lg:col-span-2 space-y-6">
        {result ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <p className="text-xs text-green-700 uppercase font-bold">Profit Impact</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{result.impact?.profit || 'N/A'}</p>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <p className="text-xs text-blue-700 uppercase font-bold">Yield Forecast</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{result.impact?.yield || 'N/A'}</p>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <p className="text-xs text-orange-700 uppercase font-bold">Risk Level</p>
                <p className="text-2xl font-bold text-orange-800 mt-1">{result.impact?.risk || 'N/A'}</p>
              </Card>
            </div>

            <Card>
              <h4 className="font-bold text-gray-900 mb-4">Recommended Crops for These Conditions</h4>
              <div className="space-y-4">
                {result.crops?.map((crop: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900">{crop.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{crop.reason}</p>
                      <div className="mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md inline-block">
                        {crop.confidence}% Match
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-blue-600 text-white">
              <div className="flex gap-4">
                <Droplets className="shrink-0" />
                <div>
                  <h4 className="font-bold">Irrigation Advisory</h4>
                  <p className="text-sm text-blue-100 mt-1 opacity-90">{result.irrigation_advice || 'No advice available.'}</p>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-12">
            <TrendingUp size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">Ready to Simulate</p>
            <p className="text-sm">Adjust conditions and click run to see AI predictions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
