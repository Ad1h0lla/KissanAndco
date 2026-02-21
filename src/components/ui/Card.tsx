import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-md", className)} {...props}>
      {children}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon size={80} strokeWidth={1.5} />
      </div>
      
      <div className="flex justify-between items-start relative z-10">
        <div className="p-2.5 bg-green-50 rounded-xl text-green-600 shadow-sm group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
          <Icon size={22} strokeWidth={2} />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide", 
            trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-display font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
