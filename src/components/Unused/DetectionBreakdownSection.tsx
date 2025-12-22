'use client';

import { ChemicalData } from '@/app/api/csv-parser';
import DetectionBreakdownChart from './DetectionBreakdownChart';

interface DetectionBreakdownSectionProps {
  chemicals: ChemicalData[];
  onBarClick?: (classification: 'pay-attention' | 'monitor-only' | 'low-exposure') => void;
}

export default function DetectionBreakdownSection({ 
  chemicals, 
  onBarClick 
}: DetectionBreakdownSectionProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900">
          <span className="text-3xl text-[#9CBB04]">{chemicals.filter(c => c.value > 0).length}</span> chemicals detected
        </h2>
      </div>
      <DetectionBreakdownChart 
        chemicals={chemicals} 
        onBarClick={onBarClick}
      />
    </div>
  );
}

