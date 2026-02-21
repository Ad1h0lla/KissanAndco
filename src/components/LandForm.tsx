import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Ruler, Sprout, Droplets, Plus, Trash2, ArrowRight } from 'lucide-react';

interface LandFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

interface ZoneInput {
  name: string;
  area: string;
  crop: string;
  waterAccess: boolean;
}

export function LandForm({ onSubmit, initialData }: LandFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    location: initialData?.location || '',
    irrigationType: initialData?.irrigationType || 'Drip',
  });
  
  const [zones, setZones] = useState<ZoneInput[]>(
    initialData?.zones?.map((z: any) => ({
      name: z.name,
      area: String(z.area),
      crop: z.crop,
      waterAccess: z.waterAccess
    })) || [{ name: 'Zone A', area: '', crop: '', waterAccess: true }]
  );

  const addZone = () => {
    setZones([...zones, { name: `Zone ${String.fromCharCode(65 + zones.length)}`, area: '', crop: '', waterAccess: false }]);
  };

  const removeZone = (index: number) => {
    if (zones.length > 1) {
      setZones(zones.filter((_, i) => i !== index));
    }
  };

  const updateZone = (index: number, field: keyof ZoneInput, value: any) => {
    const newZones = [...zones];
    newZones[index] = { ...newZones[index], [field]: value };
    setZones(newZones);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    
    // Calculate total area from zones
    const totalArea = zones.reduce((acc, zone) => acc + Number(zone.area || 0), 0);

    // Simulate geo-lookup
    const mockGeo = {
        latitude: 20.5937,
        longitude: 78.9629
    };

    await onSubmit({ 
        ...formData, 
        ...mockGeo,
        area: totalArea,
        zones: zones.map(z => ({
          name: z.name,
          area: Number(z.area),
          crop: z.crop || 'Fallow',
          status: z.crop ? 'Active' : 'Resting',
          waterAccess: z.waterAccess
        }))
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F6] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-700">
            <Sprout size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Welcome to Kissan and Co</h1>
          <p className="text-gray-500 mt-2">
            {step === 1 ? "Let's start with your farm details." : "Now, tell us about your land divisions."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Farm Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="e.g. Green Valley Estate"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input 
                    required
                    type="text" 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="City, State or GPS"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Primary Irrigation</label>
                <div className="relative">
                  <Droplets className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <select 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all appearance-none bg-gray-50 focus:bg-white"
                    value={formData.irrigationType}
                    onChange={e => setFormData({...formData, irrigationType: e.target.value})}
                  >
                    <option>Drip</option>
                    <option>Sprinkler</option>
                    <option>Flood</option>
                    <option>Rainfed</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {zones.map((zone, index) => (
                  <div key={index} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 relative group hover:border-green-200 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + index)}
                        </div>
                        <h3 className="font-bold text-gray-900">Zone {index + 1}</h3>
                      </div>
                      {zones.length > 1 && (
                        <button type="button" onClick={() => removeZone(index)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Name</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 outline-none transition-colors"
                          value={zone.name}
                          onChange={e => updateZone(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Area (Acres)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          required
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 outline-none transition-colors"
                          placeholder="0.0"
                          value={zone.area}
                          onChange={e => updateZone(index, 'area', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Current Crop</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 outline-none transition-colors"
                          placeholder="None"
                          value={zone.crop}
                          onChange={e => updateZone(index, 'crop', e.target.value)}
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${zone.waterAccess ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                            {zone.waterAccess && <Droplets size={12} className="text-white" />}
                          </div>
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={zone.waterAccess}
                            onChange={e => updateZone(index, 'waterAccess', e.target.checked)}
                          />
                          <span className="text-xs font-bold text-gray-600">Water Access</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                type="button" 
                onClick={addZone}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-bold hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Another Zone
              </button>
            </motion.div>
          )}

          <div className="flex gap-4 pt-6">
            {step === 2 && (
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/30 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : step === 1 ? <>Next Step <ArrowRight size={20} /></> : (initialData ? 'Update Farm' : 'Create Dashboard')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
