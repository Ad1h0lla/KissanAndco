import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Sprout, Droplets, Plus, Trash2, ArrowRight, LocateFixed, Satellite } from 'lucide-react';

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

interface Coordinates {
  latitude: number;
  longitude: number;
}

declare global {
  interface Window {
    ol?: any;
  }
}

const DEFAULT_COORDS: Coordinates = {
  latitude: 20.5937,
  longitude: 78.9629,
};

export function LandForm({ onSubmit, initialData }: LandFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [olReady, setOlReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    location: initialData?.location || '',
    irrigationType: initialData?.irrigationType || 'Drip',
  });

  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    initialData?.latitude && initialData?.longitude
      ? { latitude: Number(initialData.latitude), longitude: Number(initialData.longitude) }
      : null,
  );
  const [latitudeInput, setLatitudeInput] = useState(initialData?.latitude ? String(initialData.latitude) : '');
  const [longitudeInput, setLongitudeInput] = useState(initialData?.longitude ? String(initialData.longitude) : '');

  const [zones, setZones] = useState<ZoneInput[]>(
    initialData?.zones?.map((z: any) => ({
      name: z.name,
      area: String(z.area),
      crop: z.crop,
      waterAccess: z.waterAccess,
    })) || [{ name: 'Zone A', area: '', crop: '', waterAccess: true }],
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerFeatureRef = useRef<any>(null);
  const viewRef = useRef<any>(null);
  const roadLayerRef = useRef<any>(null);
  const satelliteLayerRef = useRef<any>(null);

  const center = useMemo(() => {
    if (coordinates) return { lat: coordinates.latitude, lng: coordinates.longitude };
    return { lat: DEFAULT_COORDS.latitude, lng: DEFAULT_COORDS.longitude };
  }, [coordinates]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.display_name) {
        setFormData((prev) => ({ ...prev, location: data.display_name }));
      }
    } catch {
      // Non-blocking: user can still type location manually.
    }
  };

  const setPinPosition = (lat: number, lng: number, shouldReverseGeocode = true) => {
    setCoordinates({ latitude: lat, longitude: lng });
    setLatitudeInput(lat.toFixed(6));
    setLongitudeInput(lng.toFixed(6));

    const ol = window.ol;
    if (!ol) return;

    const projected = ol.proj.fromLonLat([lng, lat]);
    const markerFeature = markerFeatureRef.current;
    if (markerFeature) {
      markerFeature.setGeometry(new ol.geom.Point(projected));
    }

    if (viewRef.current) {
      viewRef.current.animate({ center: projected, duration: 250 });
    }

    if (shouldReverseGeocode) {
      reverseGeocode(lat, lng);
    }
  };

  useEffect(() => {
    if (window.ol) {
      setOlReady(true);
      return;
    }

    const cssId = 'ol-styles';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/ol@10.6.1/ol.css';
      document.head.appendChild(link);
    }

    const scriptId = 'ol-script';
    if (document.getElementById(scriptId)) {
      const existing = document.getElementById(scriptId) as HTMLScriptElement;
      existing.addEventListener('load', () => setOlReady(true));
      existing.addEventListener('error', () => setMapError('Failed to load OpenStreet map engine.'));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdn.jsdelivr.net/npm/ol@10.6.1/dist/ol.js';
    script.async = true;
    script.defer = true;
    script.onload = () => setOlReady(true);
    script.onerror = () => setMapError('Failed to load OpenStreet map engine.');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (step !== 1 || !olReady || !window.ol || !mapContainerRef.current) return;

    const ol = window.ol;

    const roadLayer = new ol.layer.Tile({
      source: new ol.source.OSM(),
      visible: mapType === 'roadmap',
    });

    const satelliteLayer = new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri',
      }),
      visible: mapType === 'satellite',
    });

    const markerFeature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([center.lng, center.lat])),
    });

    markerFeature.setStyle(
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 9,
          fill: new ol.style.Fill({ color: '#16A34A' }),
          stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 2 }),
        }),
      }),
    );

    const markerLayer = new ol.layer.Vector({
      source: new ol.source.Vector({ features: [markerFeature] }),
    });

    const view = new ol.View({
      center: ol.proj.fromLonLat([center.lng, center.lat]),
      zoom: coordinates ? 15 : 5,
      minZoom: 3,
      maxZoom: 20,
    });

    const map = new ol.Map({
      target: mapContainerRef.current,
      layers: [satelliteLayer, roadLayer, markerLayer],
      view,
      controls: ol.control.defaults({ attribution: false }),
    });

    const markerCollection = new ol.Collection([markerFeature]);
    const translateInteraction = new ol.interaction.Translate({ features: markerCollection });
    map.addInteraction(translateInteraction);

    map.on('singleclick', (event: any) => {
      const [lng, lat] = ol.proj.toLonLat(event.coordinate);
      setPinPosition(lat, lng);
    });

    translateInteraction.on('translateend', (event: any) => {
      const geometry = event.features.item(0).getGeometry();
      const [lng, lat] = ol.proj.toLonLat(geometry.getCoordinates());
      setPinPosition(lat, lng);
    });

    mapRef.current = map;
    markerFeatureRef.current = markerFeature;
    viewRef.current = view;
    roadLayerRef.current = roadLayer;
    satelliteLayerRef.current = satelliteLayer;

    if (!coordinates) {
      setPinPosition(center.lat, center.lng, false);
    }

    return () => {
      map.setTarget(undefined);
    };
  }, [center.lat, center.lng, coordinates, mapType, olReady, step]);

  useEffect(() => {
    if (!roadLayerRef.current || !satelliteLayerRef.current) return;
    roadLayerRef.current.setVisible(mapType === 'roadmap');
    satelliteLayerRef.current.setVisible(mapType === 'satellite');
  }, [mapType]);

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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapError(null);
        setPinPosition(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setMapError('Could not fetch your current location. Please place the pin manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const applyManualCoordinates = () => {
    const lat = Number(latitudeInput);
    const lng = Number(longitudeInput);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    setPinPosition(lat, lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);

    const totalArea = zones.reduce((acc, zone) => acc + Number(zone.area || 0), 0);
    const finalCoordinates = coordinates || DEFAULT_COORDS;

    await onSubmit({
      ...formData,
      latitude: finalCoordinates.latitude,
      longitude: finalCoordinates.longitude,
      area: totalArea,
      zones: zones.map((z) => ({
        name: z.name,
        area: Number(z.area),
        crop: z.crop || 'Fallow',
        status: z.crop ? 'Active' : 'Resting',
        waterAccess: z.waterAccess,
      })),
    });

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F6] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-700">
            <Sprout size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Welcome to Kissan and Co</h1>
          <p className="text-gray-500 mt-2">
            {step === 1 ? 'Set farm details and drop a pin on the map.' : 'Now, tell us about your land divisions.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Farm Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g. Green Valley Estate"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value })}
                    >
                      <option>Drip</option>
                      <option>Sprinkler</option>
                      <option>Flood</option>
                      <option>Rainfed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={latitudeInput}
                      onChange={(e) => setLatitudeInput(e.target.value)}
                      onBlur={applyManualCoordinates}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 outline-none"
                      placeholder="20.593700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={longitudeInput}
                      onChange={(e) => setLongitudeInput(e.target.value)}
                      onBlur={applyManualCoordinates}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 outline-none"
                      placeholder="78.962900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">OpenStreet Map Picker</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMapType('roadmap')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${mapType === 'roadmap' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      Roadmap
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapType('satellite')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${mapType === 'satellite' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      <Satellite size={12} /> Satellite
                    </button>
                  </div>
                </div>

                <div className="relative h-[320px] rounded-2xl overflow-hidden border border-gray-200">
                  <div ref={mapContainerRef} className="absolute inset-0" />
                  {(!olReady || mapError) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-center p-6">
                      <MapPin className="text-gray-400 mb-2" size={22} />
                      <p className="text-sm font-medium text-gray-700">{mapError || 'Loading OpenStreet map...'}</p>
                      {mapError && <p className="text-xs text-gray-500 mt-1">You can still continue using manual coordinates.</p>}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                  >
                    <LocateFixed size={14} /> Use Current Location
                  </button>
                  <p className="text-xs text-gray-500 self-center">Click map or drag marker to place farm pin.</p>
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
                          onChange={(e) => updateZone(index, 'name', e.target.value)}
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
                          onChange={(e) => updateZone(index, 'area', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Current Crop</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 outline-none transition-colors"
                          placeholder="None"
                          value={zone.crop}
                          onChange={(e) => updateZone(index, 'crop', e.target.value)}
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
                            onChange={(e) => updateZone(index, 'waterAccess', e.target.checked)}
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
              {loading ? 'Saving...' : step === 1 ? <><span>Next Step</span><ArrowRight size={20} /></> : initialData ? 'Update Farm' : 'Create Dashboard'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
