'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CategoryInsight } from '@/app/api/utils';

interface CategoryInsightsPanelProps {
  insights: CategoryInsight[];
}

const tooltipExplanations: Record<string, string> = {
  averagePercentile: 'The average percentile rank of all detected chemicals in this category. This shows how your exposure levels compare to the general population across all chemicals in this category.',
  detectionRate: 'The percentage of chemicals in this category that were detected in your test results. A higher detection rate indicates broader exposure to chemicals in this category.',
  mostCommonSource: 'The most frequently occurring source of exposure for chemicals in this category. This helps identify the primary pathway through which you\'re being exposed to these chemicals.',
  categoryComparison: 'How this category compares to other categories in terms of exposure levels or detection rates. This provides context for understanding relative exposure patterns.'
};

export default function CategoryInsightsPanel({ insights }: CategoryInsightsPanelProps) {
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);
  const tooltipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Calculate tooltip position when opened
  useEffect(() => {
    const updatePosition = () => {
      if (openTooltip && tooltipRefs.current.has(openTooltip)) {
        const button = tooltipRefs.current.get(openTooltip);
        if (button) {
          const rect = button.getBoundingClientRect();
          const tooltipWidth = 256; // w-64 = 256px
          const tooltipHeight = 120; // Approximate height
          const spacing = 8; // Space between button and tooltip
          
          // Calculate left position: align right edge of tooltip with right edge of button
          let left = rect.right - tooltipWidth;
          
          // Ensure tooltip doesn't go off the left edge of screen
          if (left < 8) {
            left = 8;
          }
          
          // Ensure tooltip doesn't go off the right edge of screen
          if (rect.right > window.innerWidth - 8) {
            left = window.innerWidth - tooltipWidth - 8;
          }
          
          // Calculate top position: position above the button
          let top = rect.top - spacing;
          let placement: 'above' | 'below' = 'above';
          
          // If tooltip would go above viewport, position it below the button instead
          if (top < tooltipHeight + 8) {
            top = rect.bottom + spacing;
            placement = 'below';
          }
          
          setTooltipPosition({
            top: top,
            left: left,
            placement: placement,
          });
        }
      } else {
        setTooltipPosition(null);
      }
    };

    updatePosition();
    
    // Update position on scroll and resize
    if (openTooltip) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [openTooltip]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-tooltip-trigger]') && !target.closest('[data-tooltip-content]')) {
        setOpenTooltip(null);
      }
    };

    if (openTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openTooltip]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="grid grid-cols-auto gap-1" style={{ gridTemplateColumns: `repeat(${insights.length}, minmax(0, 1fr))` }}>
        {insights.map((insight, index) => (
          <motion.div
            key={insight.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-[#404B69]/50 hover:shadow-md transition-all duration-300 relative overflow-visible"
          >
            <button
              ref={(el) => {
                if (el) {
                  tooltipRefs.current.set(insight.type, el);
                } else {
                  tooltipRefs.current.delete(insight.type);
                }
              }}
              onClick={() => setOpenTooltip(openTooltip === insight.type ? null : insight.type)}
              className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label={`Information about ${insight.label}`}
              data-tooltip-trigger
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {openTooltip === insight.type && tooltipPosition && typeof window !== 'undefined' && createPortal(
              <div 
                className="fixed z-[9999] w-64 bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
                data-tooltip-content
                style={{ 
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  transform: tooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none'
                }}
              >
                <p>{tooltipExplanations[insight.type] || 'Information about this metric.'}</p>
                <div className={`absolute ${tooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
              </div>,
              document.body
            )}
            <div className="flex-1 min-w-0 pr-6">
              <div className="text-xs font-medium text-gray-600 mb-0.5">{insight.label}</div>
              <div className="text-base font-bold text-gray-900 mb-0.5 truncate">
                {typeof insight.value === 'number' && insight.type === 'detectionRate' 
                  ? `${insight.value}%`
                  : typeof insight.value === 'number' && insight.type === 'averagePercentile'
                  ? `${insight.value}%`
                  : insight.value}
              </div>
              {insight.subValue && (
                <div className="text-xs text-gray-500 truncate">{insight.subValue}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

