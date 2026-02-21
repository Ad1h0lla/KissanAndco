import React from 'react';
import { motion } from 'motion/react';

interface FarmMapProps {
  zones: any[];
  area: number;
  onSelectZone: (zone: any) => void;
  selectedZoneId?: number | null;
}

export function FarmMap({ zones, area, onSelectZone, selectedZoneId }: FarmMapProps) {
  // Canvas dimensions
  const width = 800;
  const height = 600;
  const padding = 60;
  
  // Calculate grid layout
  // In a real app, we would use real coordinates (lat/lon) mapped to SVG space
  // Here we simulate a nice layout
  const cols = 3;
  const rows = Math.ceil(zones.length / cols);
  
  const cellWidth = (width - padding * 2) / cols;
  const cellHeight = (height - padding * 2) / Math.max(2, rows);
  const gap = 20;

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[500px] bg-[#F3F4F6] rounded-3xl relative overflow-hidden shadow-inner border border-gray-200 group">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#9CA3AF 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* SVG Canvas */}
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full absolute inset-0"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Farm Boundary */}
        <path 
          d={`M ${padding/2} ${padding/2} H ${width - padding/2} V ${height - padding/2} H ${padding/2} Z`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="2"
          strokeDasharray="10,10"
        />

        {/* Zones */}
        {zones.map((zone, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          
          const x = padding + col * cellWidth + gap/2;
          const y = padding + row * cellHeight + gap/2;
          const w = cellWidth - gap;
          const h = cellHeight - gap;
          
          const isSelected = selectedZoneId === zone.id;

          // Determine color based on crop
          let fillColor = "#F3F4F6"; // Default
          let strokeColor = "#D1D5DB";
          
          if (zone.status === 'Active') {
            if (zone.crop?.toLowerCase().includes('wheat')) { fillColor = "#FEF9C3"; strokeColor = "#FACC15"; } // Yellow
            else if (zone.crop?.toLowerCase().includes('rice')) { fillColor = "#DCFCE7"; strokeColor = "#4ADE80"; } // Green
            else if (zone.crop?.toLowerCase().includes('cotton')) { fillColor = "#FFFFFF"; strokeColor = "#E5E7EB"; } // White
            else if (zone.crop?.toLowerCase().includes('sugarcane')) { fillColor = "#D1FAE5"; strokeColor = "#34D399"; } // Teal
            else { fillColor = "#E0F2FE"; strokeColor = "#38BDF8"; } // Blue
          }

          return (
            <g 
              key={zone.id || index} 
              onClick={() => onSelectZone(zone)}
              className="cursor-pointer transition-all duration-300"
              style={{ transformOrigin: `${x + w/2}px ${y + h/2}px` }}
            >
              {/* Shadow */}
              <rect
                x={x + 4} y={y + 4}
                width={w} height={h}
                rx="12"
                fill="rgba(0,0,0,0.05)"
                className="transition-all duration-300"
                style={{ opacity: isSelected ? 0.2 : 0.05 }}
              />

              {/* Zone Shape */}
              <motion.rect
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: isSelected ? 1.02 : 1 }}
                transition={{ delay: index * 0.05 }}
                x={x} y={y}
                width={w} height={h}
                rx="12"
                fill={fillColor}
                stroke={isSelected ? "#16A34A" : strokeColor}
                strokeWidth={isSelected ? 3 : 1}
                className="hover:opacity-90"
              />
              
              {/* Irrigation Lines (Animated) */}
              {zone.waterAccess && (
                <g opacity="0.4">
                  {[1, 2, 3].map(i => (
                    <line 
                      key={i}
                      x1={x} y1={y + (h/4)*i} 
                      x2={x + w} y2={y + (h/4)*i} 
                      stroke="#3B82F6" 
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                  ))}
                </g>
              )}

              {/* Label */}
              <foreignObject x={x} y={y} width={w} height={h} className="pointer-events-none">
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                  <span className="font-display font-bold text-gray-800 text-lg tracking-tight">
                    {zone.name}
                  </span>
                  {zone.status === 'Active' && (
                    <span className="text-xs font-medium text-gray-500 mt-1 bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {zone.crop}
                    </span>
                  )}
                  {isSelected && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full"
                    >
                      SELECTED
                    </motion.div>
                  )}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs font-medium text-gray-600 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div> Irrigated
        </div>
        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs font-medium text-gray-600 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div> Active
        </div>
      </div>
    </div>
  );
}
