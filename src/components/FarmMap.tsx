import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Compass, Waves, Route } from 'lucide-react';

interface FarmMapProps {
  zones: any[];
  area: number;
  onSelectZone: (zone: any) => void;
  selectedZoneId?: number | null;
  mode?: '2d' | 'satellite';
}

interface ZoneShape {
  x: number;
  y: number;
  w: number;
  h: number;
  path: string;
}

function cropPalette(crop: string | undefined, status: string | undefined, mode: '2d' | 'satellite') {
  if (mode === 'satellite') {
    // Satellite mode: earthy tones
    if (status === 'Fallow' || status === 'Resting') return { fill: '#9C7A54', stroke: '#7A5F3E' };
    if (status === 'Needs Water' || status === 'Irrigation Scheduled') return { fill: '#D4A574', stroke: '#C9944F' };
    if (!status || status === 'Active' || status === 'Healthy') return { fill: '#4F8A54', stroke: '#396741' };
    const key = crop?.toLowerCase() || '';
    if (key.includes('rice')) return { fill: '#4f8a54', stroke: '#396741' };
    if (key.includes('wheat')) return { fill: '#a49355', stroke: '#7f733e' };
    if (key.includes('cotton')) return { fill: '#8f9e79', stroke: '#6f7e5d' };
    if (key.includes('sugarcane')) return { fill: '#538b68', stroke: '#3f6d51' };
    return { fill: '#678d60', stroke: '#4f6d4b' };
  }

  // 2D mode: status-based color coding with green/yellow/brown theme
  if (status === 'Fallow' || status === 'Resting') return { fill: '#D2B48C', stroke: '#A0826D' }; // Brown for fallow
  if (status === 'Needs Water' || status === 'Irrigation Scheduled') return { fill: '#FFEAA7', stroke: '#FDCB6E' }; // Yellow for needs water
  if (!status || status === 'Active' || status === 'Healthy') return { fill: '#A3E635', stroke: '#84CC16' }; // Green for healthy
  
  const key = crop?.toLowerCase() || '';
  if (key.includes('rice')) return { fill: '#DCFCE7', stroke: '#4ADE80' };
  if (key.includes('wheat')) return { fill: '#FEF9C3', stroke: '#FACC15' };
  if (key.includes('cotton')) return { fill: '#FFFFFF', stroke: '#E5E7EB' };
  if (key.includes('sugarcane')) return { fill: '#CCFBF1', stroke: '#2DD4BF' };
  return { fill: '#DBEAFE', stroke: '#60A5FA' };
}

export function FarmMap({ zones, area, onSelectZone, selectedZoneId, mode = '2d' }: FarmMapProps) {
  // Visualization mode is simplified; we focus on 2D visualization only
  const localMode = mode === 'satellite' ? 'satellite' : '2d';

  const width = 900;
  const height = 640;
  const padding = 55;
  const cols = 3;
  const rows = Math.ceil(Math.max(1, zones.length) / cols);
  const cellWidth = (width - padding * 2) / cols;
  const cellHeight = (height - padding * 2) / Math.max(2, rows);
  const gap = 18;

  const zoneShapes = useMemo<ZoneShape[]>(() => {
    return zones.map((_, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const x = padding + col * cellWidth + gap / 2;
      const y = padding + row * cellHeight + gap / 2;
      const w = cellWidth - gap;
      const h = cellHeight - gap;

      const path = `
        M ${x + 12} ${y}
        H ${x + w - 14}
        Q ${x + w} ${y + 8} ${x + w} ${y + 20}
        V ${y + h - 14}
        Q ${x + w - 6} ${y + h} ${x + w - 18} ${y + h}
        H ${x + 14}
        Q ${x} ${y + h - 8} ${x} ${y + h - 22}
        V ${y + 14}
        Q ${x + 6} ${y} ${x + 12} ${y}
        Z
      `;

      return { x, y, w, h, path };
    });
  }, [zones]);

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[500px] bg-[#F3F4F6] rounded-3xl relative overflow-hidden shadow-inner border border-gray-200 group">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#9CA3AF 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full absolute inset-0" preserveAspectRatio="xMidYMid meet">
        <path
          d={`M ${padding / 2} ${padding / 2} H ${width - padding / 2} V ${height - padding / 2} H ${padding / 2} Z`}
          fill="none"
          stroke={localMode === 'satellite' ? 'rgba(226,232,240,0.45)' : '#D1D5DB'}
          strokeWidth="2"
          strokeDasharray="10,10"
        />

        <path
          d={`M ${padding - 8} ${height * 0.28} C ${width * 0.3} ${height * 0.22}, ${width * 0.45} ${height * 0.34}, ${width - padding + 6} ${height * 0.25}`}
          stroke={localMode === 'satellite' ? 'rgba(191,219,254,0.45)' : 'rgba(59,130,246,0.25)'}
          strokeWidth="5"
          fill="none"
          strokeDasharray="12,8"
        />

        <path
          d={`M ${padding - 6} ${height * 0.72} Q ${width * 0.5} ${height * 0.62} ${width - padding + 6} ${height * 0.75}`}
          stroke={localMode === 'satellite' ? 'rgba(203,213,225,0.45)' : 'rgba(148,163,184,0.5)'}
          strokeWidth="8"
          fill="none"
        />

        {zones.map((zone, index) => {
          const shape = zoneShapes[index];
          if (!shape) return null;

          const isSelected = selectedZoneId === zone.id;
          const palette = cropPalette(zone.crop, zone.status, localMode);

          return (
            <g key={zone.id || index} onClick={() => onSelectZone(zone)} className="cursor-pointer" style={{ transformOrigin: `${shape.x + shape.w / 2}px ${shape.y + shape.h / 2}px` }}>
              <path
                d={shape.path}
                fill="rgba(0,0,0,0.18)"
                transform="translate(4 5)"
                opacity={localMode === 'satellite' ? 0.22 : 0.08}
              />

              <motion.path
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: isSelected ? 1.03 : 1 }}
                transition={{ delay: index * 0.04 }}
                d={shape.path}
                fill={palette.fill}
                stroke={isSelected ? '#22C55E' : palette.stroke}
                strokeWidth={isSelected ? 3 : 1.5}
                className="hover:opacity-95"
              />

              {zone.waterAccess && (
                <g opacity={localMode === 'satellite' ? 0.5 : 0.4}>
                  {[1, 2, 3].map((i) => (
                    <line
                      key={i}
                      x1={shape.x + 10}
                      y1={shape.y + (shape.h / 4) * i}
                      x2={shape.x + shape.w - 10}
                      y2={shape.y + (shape.h / 4) * i}
                      stroke={localMode === 'satellite' ? '#BFDBFE' : '#3B82F6'}
                      strokeWidth="1.6"
                      strokeDasharray="5,4"
                    />
                  ))}
                </g>
              )}

              <foreignObject x={shape.x + 8} y={shape.y + 8} width={shape.w - 16} height={shape.h - 16} className="pointer-events-none">
                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                  <span className={`font-display font-bold text-base tracking-tight ${localMode === 'satellite' ? 'text-white drop-shadow' : 'text-gray-800'}`}>
                    {zone.name || `Zone ${zone.id}`}
                  </span>
                  <span className={`text-[11px] mt-1 px-2 py-0.5 rounded-full font-medium ${localMode === 'satellite' ? 'bg-black/30 text-gray-100' : 'bg-white/70 text-gray-600'}`}>
                    {zone.crop || 'Fallow'}
                  </span>
                  <span className={`text-[9px] mt-1 px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase ${
                    zone.status === 'Healthy' ? 'bg-green-200 text-green-800' :
                    zone.status === 'Needs Water' ? 'bg-yellow-200 text-yellow-800' :
                    zone.status === 'Fallow' || zone.status === 'Resting' ? 'bg-amber-200 text-amber-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {zone.status || 'Unknown'}
                  </span>
                  {isSelected && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[9px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full">
                      ✓ SELECTED
                    </motion.div>
                  )}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* Simple controls removed - focus on a single clear visualization */}

      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <Compass size={12} /> N
        </div>
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs font-medium text-gray-600">
          {area || '--'} acres
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 justify-end max-w-[80%]">
        <div className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm border border-gray-200 text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500"></div> Healthy
        </div>
        <div className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm border border-gray-200 text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div> Needs Water
        </div>
        <div className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm border border-gray-200 text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-600"></div> Fallow
        </div>
      </div>
    </div>
  );
}
