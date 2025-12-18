'use client';

import React from 'react';
import { ChemicalData } from '@/app/api/csv-parser';

interface DetectionStatusCardProps {
  chemicals: ChemicalData[];
}

export default function DetectionStatusCard({ chemicals }: DetectionStatusCardProps) {
  const totalChemicals = chemicals.length;
  const detectedCount = chemicals.filter(c => c.value > 0).length;
  const detectionRate = totalChemicals > 0 ? Math.round((detectedCount / totalChemicals) * 100) : 0;

  // Calculate unique categories detected
  const detectedChemicals = chemicals.filter(c => c.value > 0);
  const uniqueCategories = new Set(
    detectedChemicals.map(c => c.exposureCategory).filter(Boolean)
  );
  const categoriesDetected = uniqueCategories.size;

  // Calculate unique exposure sources
  const allSources = new Set<string>();
  detectedChemicals.forEach(c => {
    if (c.primarySource) allSources.add(c.primarySource);
    if (c.secondarySources) {
      c.secondarySources.split(',').forEach(source => {
        const trimmed = source.trim();
        if (trimmed) allSources.add(trimmed);
      });
    }
  });
  const exposureSources = allSources.size;

  // Average detection rate (placeholder - can be calculated from historical data)
  const averageDetectionRate = 35;

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-6 py-4">
      {/* Main stat: (#detected) / (# total) */}
      <div className="text-center">
        <div className="text-6xl font-bold leading-none">
          <span className="text-[#9CBB04]">{detectedCount}</span>
          <span className="text-gray-400 mx-2">/</span>
          <span className="text-gray-700">{totalChemicals}</span>
        </div>
      </div>

      {/* Button-style stats: categories | exposure sources */}
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
          {categoriesDetected} categories detected
        </div>
        <div className="text-gray-300">|</div>
        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
          {exposureSources} exposure sources
        </div>
      </div>

      {/* Progress bar with average indicator */}
      <div className="w-full space-y-2">
        <div className="relative h-4 bg-gray-100 rounded-full overflow-visible">
          {/* Progress fill */}
          <div 
            className="h-full bg-[#9CBB04] transition-all duration-700 ease-out rounded-full"
            style={{ width: `${detectionRate}%` }}
          />
          {/* Average detection indicator (vertical dotted line extending above and below) */}
          {averageDetectionRate > 0 && averageDetectionRate < 100 && (
            <div 
              className="absolute"
              style={{ 
                left: `${averageDetectionRate}%`,
                top: '-8px',
                bottom: '-8px',
                width: '1px',
                transform: 'translateX(-50%)',
                background: 'repeating-linear-gradient(to bottom, #9CA3AF 0px, #9CA3AF 2px, transparent 2px, transparent 4px)'
              }}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span></span>
          <span>{detectionRate}% detected</span>
          {averageDetectionRate > 0 && averageDetectionRate < 100 && (
            <span className="text-gray-400">Avg: {averageDetectionRate}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

