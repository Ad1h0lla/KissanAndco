import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  BadgeDollarSign,
  Bug,
  CircleGauge,
  Droplets,
  LineChart,
  ShieldCheck,
  Sprout,
  Users,
} from 'lucide-react';
import { Card } from './ui/Card';
import { FarmMap } from './FarmMap';

interface FarmSimulatorProps {
  farm: any;
}

interface StrategyControls {
  rainfallVariance: number;
  fertilizerBudgetIndex: number;
  laborCostChange: number;
  marketVolatility: number;
  pestOutbreakProbability: number;
  insuranceCoverage: number;
}

interface ScenarioResult {
  expectedProfit: number;
  worstCaseProfit: number;
  bestCaseProfit: number;
  survivalProbability: number;
  lossProbability: number;
  riskScore: number;
  breakEvenRevenue: number;
  downsideAtRisk: number;
  expectedLoss: number;
  bins: { label: string; count: number }[];
  topRisk: string;
  hotspotZone: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const numberFormat = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

function randomNormal() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function buildHistogram(values: number[], bucketCount = 12) {
  if (!values.length) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const bins = Array.from({ length: bucketCount }, () => 0);

  for (const value of values) {
    const raw = ((value - min) / range) * bucketCount;
    const bucket = Math.min(bucketCount - 1, Math.floor(raw));
    bins[bucket] += 1;
  }

  return bins.map((count, index) => {
    const bucketStart = min + (index * range) / bucketCount;
    return {
      label: `₹${Math.round(bucketStart / 1000)}k`,
      count,
    };
  });
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

function runRiskSimulation(area: number, controls: StrategyControls, zones: any[] = [], runs = 300): ScenarioResult {
  const baseRevenue = Math.max(1, area) * 47000;
  const baseCost = Math.max(1, area) * 21000;

  const profits: number[] = [];
  const zoneLossCounter = new Map<string, number>();

  const cropProfiles: Record<string, { margin: number; climate: number; pest: number; market: number }> = {
    wheat: { margin: 1.02, climate: 0.95, pest: 1.05, market: 1.03 },
    rice: { margin: 0.96, climate: 1.08, pest: 1.0, market: 0.94 },
    cotton: { margin: 1.1, climate: 1.06, pest: 1.18, market: 1.14 },
    sugarcane: { margin: 1.12, climate: 1.12, pest: 1.02, market: 0.92 },
    maize: { margin: 1.0, climate: 1.0, pest: 0.95, market: 0.98 },
    fallow: { margin: 0.76, climate: 0.85, pest: 0.8, market: 0.8 },
  };

  const zonesWithDefaults = zones.length
    ? zones
    : [{ name: 'Primary Zone', area: Math.max(1, area), crop: 'Fallow', waterAccess: true }];

  for (let i = 0; i < runs; i += 1) {
    const rainShock = randomNormal() * (controls.rainfallVariance / 100) * 0.55;
    const marketShock = randomNormal() * (controls.marketVolatility / 100) * 0.85;
    const pestEvent = Math.random() < controls.pestOutbreakProbability / 100;
    const pestShock = pestEvent ? -(0.08 + Math.random() * 0.2) : 0;

    const inputShift = (controls.fertilizerBudgetIndex - 100) / 100;
    const laborShift = controls.laborCostChange / 100;

    let yieldAccumulator = 0;
    let marketAccumulator = 0;
    let pestPressureAccumulator = 0;

    for (const zone of zonesWithDefaults) {
      const cropKey = String(zone.crop || 'fallow').toLowerCase().trim();
      const profile = cropProfiles[cropKey] || cropProfiles.fallow;
      const zoneArea = Math.max(0.2, Number(zone.area) || 0.2);
      const zoneWeight = zoneArea / Math.max(area, 1);
      const irrigationBonus = zone.waterAccess ? 0.06 : -0.08;

      const zoneClimateShock = rainShock * profile.climate + irrigationBonus + inputShift * 0.2;
      const zonePestShock = pestEvent ? pestShock * profile.pest : 0;
      const zoneYield = clamp(1 + zoneClimateShock + zonePestShock, 0.38, 1.85);
      const zoneMarket = clamp(1 + marketShock * profile.market, 0.6, 1.65);

      yieldAccumulator += zoneYield * zoneWeight * profile.margin;
      marketAccumulator += zoneMarket * zoneWeight;
      pestPressureAccumulator += (pestEvent ? 1 : 0) * profile.pest * zoneWeight;

      if (zoneYield < 0.8) {
        const zoneName = zone.name || `Zone ${zoneArea.toFixed(1)}`;
        zoneLossCounter.set(zoneName, (zoneLossCounter.get(zoneName) || 0) + 1);
      }
    }

    const yieldFactor = clamp(yieldAccumulator, 0.35, 2);
    const priceFactor = clamp(marketAccumulator, 0.58, 1.75);
    const revenue = baseRevenue * yieldFactor * priceFactor;

    const cost =
      baseCost *
      (1 +
        inputShift * 0.52 +
        laborShift * 0.55 +
        controls.marketVolatility / 900 +
        pestPressureAccumulator * 0.05);

    let profit = revenue - cost;

    if (profit < 0 && controls.insuranceCoverage > 0) {
      const support = Math.abs(profit) * (controls.insuranceCoverage / 100) * 0.5;
      profit += support;
    }

    profits.push(profit);
  }

  const expectedProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;
  const worstCaseProfit = percentile(profits, 0.1);
  const bestCaseProfit = percentile(profits, 0.9);
  const lossCount = profits.filter((p) => p < 0).length;
  const lossProbability = (lossCount / profits.length) * 100;
  const survivalProbability = ((profits.length - lossCount) / profits.length) * 100;
  const downsideAtRisk = percentile(profits, 0.05);
  const expectedLossValues = profits.filter((value) => value < 0);
  const expectedLoss = expectedLossValues.length
    ? expectedLossValues.reduce((sum, value) => sum + Math.abs(value), 0) / expectedLossValues.length
    : 0;

  const breakEvenRevenue = baseCost * (1 + controls.laborCostChange / 240);

  const riskScore = clamp(
    Math.round(
      0.48 * (100 - survivalProbability) +
        0.25 * controls.marketVolatility +
        0.17 * controls.pestOutbreakProbability +
        0.1 * controls.rainfallVariance,
    ),
    1,
    99,
  );

  const dominantRisks = [
    { key: 'Market volatility pressure', value: controls.marketVolatility },
    { key: 'Pest disruption risk', value: controls.pestOutbreakProbability },
    { key: 'Rainfall uncertainty', value: controls.rainfallVariance },
    { key: 'Labor cost inflation', value: Math.max(0, controls.laborCostChange) },
  ].sort((a, b) => b.value - a.value);
  const hotspotZone = [...zoneLossCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'No critical hotspot';

  return {
    expectedProfit,
    worstCaseProfit,
    bestCaseProfit,
    survivalProbability,
    lossProbability,
    riskScore,
    breakEvenRevenue,
    downsideAtRisk,
    expectedLoss,
    bins: buildHistogram(profits),
    topRisk: dominantRisks[0]?.key ?? 'Balanced risk profile',
    hotspotZone,
  };
}

export function FarmSimulator({ farm }: FarmSimulatorProps) {
  const [controls, setControls] = useState<StrategyControls>({
    rainfallVariance: 28,
    fertilizerBudgetIndex: 100,
    laborCostChange: 12,
    marketVolatility: 26,
    pestOutbreakProbability: 18,
    insuranceCoverage: 30,
  });

  const [runId, setRunId] = useState(0);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  const simulation = useMemo(() => {
    return runRiskSimulation(Number(farm?.area) || 4, controls, farm?.zones || [], 450 + runId * 7);
  }, [farm?.area, farm?.zones, controls, runId]);

  const normalizedBins = useMemo(() => {
    const peak = Math.max(...simulation.bins.map((bin) => bin.count), 1);
    return simulation.bins.map((bin) => ({
      ...bin,
      height: Math.max(8, (bin.count / peak) * 100),
    }));
  }, [simulation.bins]);

  const riskTone =
    simulation.riskScore >= 70
      ? { label: 'High', className: 'bg-red-100 text-red-700 border-red-200' }
      : simulation.riskScore >= 40
      ? { label: 'Moderate', className: 'bg-amber-100 text-amber-700 border-amber-200' }
      : { label: 'Low', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };

  const setScenario = (type: 'defensive' | 'balanced' | 'aggressive') => {
    if (type === 'defensive') {
      setControls({
        rainfallVariance: 18,
        fertilizerBudgetIndex: 92,
        laborCostChange: 8,
        marketVolatility: 16,
        pestOutbreakProbability: 10,
        insuranceCoverage: 70,
      });
      return;
    }

    if (type === 'aggressive') {
      setControls({
        rainfallVariance: 40,
        fertilizerBudgetIndex: 135,
        laborCostChange: 22,
        marketVolatility: 38,
        pestOutbreakProbability: 28,
        insuranceCoverage: 12,
      });
      return;
    }

    setControls({
      rainfallVariance: 28,
      fertilizerBudgetIndex: 100,
      laborCostChange: 12,
      marketVolatility: 26,
      pestOutbreakProbability: 18,
      insuranceCoverage: 30,
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Risk-Aware Strategy Simulator</p>
            <h3 className="mt-2 text-2xl font-display font-bold text-gray-900">Plan before you spend a single rupee</h3>
            <p className="mt-1 text-sm text-gray-600">Simulates weather, pest, input, and market uncertainty to show expected outcomes.</p>
          </div>
          <button
            onClick={() => setRunId((value) => value + 1)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Run new simulation
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2 border-gray-200 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h4 className="text-lg font-bold text-gray-900">Scenario Controls</h4>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">{farm?.area || '--'} acres</span>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button onClick={() => setScenario('defensive')} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Defensive</button>
            <button onClick={() => setScenario('balanced')} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Balanced</button>
            <button onClick={() => setScenario('aggressive')} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Aggressive</button>
          </div>

          <div className="space-y-5">
            <SliderRow
              label="Rainfall variance"
              icon={Droplets}
              value={controls.rainfallVariance}
              suffix="%"
              min={5}
              max={60}
              color="emerald"
              onChange={(value) => setControls((prev) => ({ ...prev, rainfallVariance: value }))}
            />
            <SliderRow
              label="Fertilizer budget index"
              icon={Sprout}
              value={controls.fertilizerBudgetIndex}
              suffix="%"
              min={70}
              max={150}
              color="blue"
              onChange={(value) => setControls((prev) => ({ ...prev, fertilizerBudgetIndex: value }))}
            />
            <SliderRow
              label="Labor cost change"
              icon={Users}
              value={controls.laborCostChange}
              suffix="%"
              min={-10}
              max={35}
              color="amber"
              onChange={(value) => setControls((prev) => ({ ...prev, laborCostChange: value }))}
            />
            <SliderRow
              label="Market price volatility"
              icon={LineChart}
              value={controls.marketVolatility}
              suffix="%"
              min={5}
              max={55}
              color="rose"
              onChange={(value) => setControls((prev) => ({ ...prev, marketVolatility: value }))}
            />
            <SliderRow
              label="Pest outbreak probability"
              icon={Bug}
              value={controls.pestOutbreakProbability}
              suffix="%"
              min={2}
              max={40}
              color="orange"
              onChange={(value) => setControls((prev) => ({ ...prev, pestOutbreakProbability: value }))}
            />
            <SliderRow
              label="Insurance coverage"
              icon={ShieldCheck}
              value={controls.insuranceCoverage}
              suffix="%"
              min={0}
              max={80}
              color="teal"
              onChange={(value) => setControls((prev) => ({ ...prev, insuranceCoverage: value }))}
            />
          </div>
        </Card>

        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={BadgeDollarSign}
              label="Expected Profit"
              value={`₹${numberFormat.format(simulation.expectedProfit)}`}
              tone="emerald"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Worst Case (P10)"
              value={`₹${numberFormat.format(simulation.worstCaseProfit)}`}
              tone="rose"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Survival Probability"
              value={`${simulation.survivalProbability.toFixed(1)}%`}
              tone="blue"
            />
            <MetricCard
              icon={CircleGauge}
              label="Risk Score"
              value={`${simulation.riskScore}/99`}
              tone="amber"
              pill={riskTone}
            />
          </div>

          <Card className="overflow-hidden border-gray-200">
            <div className="flex flex-col gap-1 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Profit Distribution</h4>
                <p className="text-sm text-gray-500">450+ Monte Carlo runs with zone-level crop and water effects.</p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Best case: ₹{numberFormat.format(simulation.bestCaseProfit)}</p>
            </div>

            <div className="mt-6 h-56 rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4">
              <div className="flex h-full items-end gap-1">
                {normalizedBins.map((bin) => (
                  <div key={bin.label} className="group flex-1">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300 transition-all duration-500 group-hover:from-emerald-600"
                      style={{ height: `${bin.height}%` }}
                    />
                    <p className="mt-2 truncate text-center text-[10px] font-semibold text-gray-400">{bin.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="border-gray-200">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Break-even Revenue</p>
                <p className="mt-2 text-xl font-bold text-gray-900">₹{numberFormat.format(simulation.breakEvenRevenue)}</p>
                <p className="mt-1 text-xs text-gray-500">Per season, based on current cost pressure.</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Dominant Risk Driver</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{simulation.topRisk}</p>
                <p className="mt-1 text-xs text-gray-500">Highest-impact risk in this scenario profile.</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Action Hint</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{simulation.riskScore > 60 ? 'Reduce volatility exposure with hedged crop mix and higher coverage.' : 'Current setup is resilient. Optimize margins with selective input increase.'}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Loss Probability</p>
                <p className="mt-2 text-xl font-bold text-rose-700">{simulation.lossProbability.toFixed(1)}%</p>
                <p className="mt-1 text-xs text-rose-700/80">Chance of ending season below zero profit.</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">VaR (5%)</p>
                <p className="mt-2 text-xl font-bold text-amber-800">₹{numberFormat.format(simulation.downsideAtRisk)}</p>
                <p className="mt-1 text-xs text-amber-800/80">Severe downside threshold in 1 out of 20 seasons.</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Hotspot Zone</p>
                <p className="mt-2 text-lg font-bold text-blue-900">{simulation.hotspotZone}</p>
                <p className="mt-1 text-xs text-blue-900/70">Most frequently stressed zone across runs.</p>
              </div>
            </div>
          </Card>

          <Card className="border-gray-200 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Farm Layout Preview</h4>
                <p className="text-sm text-gray-500">Mock map for visual planning, with satellite-style context.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Expected downside loss: ₹{numberFormat.format(simulation.expectedLoss)}
              </span>
            </div>
            <div className="h-[340px]">
              <FarmMap
                zones={farm?.zones || []}
                area={Number(farm?.area) || 0}
                selectedZoneId={selectedZoneId}
                onSelectZone={(zone) => setSelectedZoneId(zone?.id ?? null)}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  value: number;
  suffix: string;
  min: number;
  max: number;
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'orange' | 'teal';
  onChange: (value: number) => void;
}

function SliderRow({ label, icon: Icon, value, suffix, min, max, color, onChange }: SliderRowProps) {
  const palette: Record<SliderRowProps['color'], string> = {
    emerald: 'text-emerald-600 accent-emerald-600',
    blue: 'text-blue-600 accent-blue-600',
    amber: 'text-amber-600 accent-amber-600',
    rose: 'text-rose-600 accent-rose-600',
    orange: 'text-orange-600 accent-orange-600',
    teal: 'text-teal-600 accent-teal-600',
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Icon size={15} /> {label}
        </label>
        <span className={`text-sm font-bold ${palette[color].split(' ')[0]}`}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 ${palette[color].split(' ')[1]}`}
      />
    </div>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  tone: 'emerald' | 'rose' | 'blue' | 'amber';
  pill?: { label: string; className: string };
}

function MetricCard({ icon: Icon, label, value, tone, pill }: MetricCardProps) {
  const tones: Record<MetricCardProps['tone'], string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };

  return (
    <Card className={`border ${tones[tone]} p-4`}>
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-white/80 p-2">
          <Icon size={18} />
        </div>
        {pill ? <span className={`rounded-full border px-2 py-1 text-[11px] font-bold uppercase ${pill.className}`}>{pill.label}</span> : null}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-xl font-display font-bold">{value}</p>
    </Card>
  );
}
