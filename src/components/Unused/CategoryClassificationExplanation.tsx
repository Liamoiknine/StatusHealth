'use client';

import { ChemicalData } from '@/app/api/csv-parser';
import { getCategoryStatusInfo } from '@/app/api/utils';
import { EXPOSURE_COLOR_CLASSES, EXPOSURE_COLORS } from '@/lib/colors';

interface CategoryClassificationExplanationProps {
  chemicals: ChemicalData[];
}

export default function CategoryClassificationExplanation({ 
  chemicals 
}: CategoryClassificationExplanationProps) {
  const categoryStatus = getCategoryStatusInfo(chemicals);
  const detectedChemicals = chemicals.filter(c => c.value > 0);
  const payAttentionCount = detectedChemicals.filter(c => (c.percentile || 0) > 0.6).length;
  const monitorOnlyCount = detectedChemicals.filter(c => {
    const p = c.percentile || 0;
    return p > 0.3 && p <= 0.6;
  }).length;
  const lowExposureCount = detectedChemicals.filter(c => {
    const p = c.percentile || 0;
    return p > 0 && p <= 0.3;
  }).length;

  // Determine the reason for the classification
  const getClassificationReason = () => {
    if (categoryStatus.text === 'Pay Attention') {
      return `This category is classified as "Pay Attention" because you have ${payAttentionCount} chemical${payAttentionCount !== 1 ? 's' : ''} with exposure levels in the 60th-100th percentile range. These higher exposure levels suggest you may want to take steps to reduce your contact with these chemicals.`;
    } else if (categoryStatus.text === 'Monitor Only') {
      if (payAttentionCount >= 1) {
        return `This category is classified as "Monitor Only" because you have ${payAttentionCount} chemical${payAttentionCount !== 1 ? 's' : ''} with exposure levels in the 60th-100th percentile range. While this warrants attention, the overall category exposure is moderate.`;
      } else {
        return `This category is classified as "Monitor Only" because you have ${monitorOnlyCount} chemical${monitorOnlyCount !== 1 ? 's' : ''} with exposure levels in the 30th-60th percentile range. This indicates moderate exposure that should be monitored.`;
      }
    } else {
      return `This category is classified as "Low Exposure" because you have fewer than 3 chemicals in the moderate exposure range and no chemicals in the high exposure range. Your exposure levels in this category are generally lower compared to the general population.`;
    }
  };

  const getClassificationIcon = (type: 'Pay Attention' | 'Monitor Only' | 'Low Exposure') => {
    switch (type) {
      case 'Pay Attention':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'Monitor Only':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'Low Exposure':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getColorClasses = (type: 'Pay Attention' | 'Monitor Only' | 'Low Exposure') => {
    switch (type) {
      case 'Pay Attention':
        return {
          bg: EXPOSURE_COLOR_CLASSES.payAttention.bgLight,
          border: EXPOSURE_COLOR_CLASSES.payAttention.border,
          text: EXPOSURE_COLOR_CLASSES.payAttention.text,
          badge: EXPOSURE_COLOR_CLASSES.payAttention.bg,
          iconBg: 'bg-red-50'
        };
      case 'Monitor Only':
        return {
          bg: EXPOSURE_COLOR_CLASSES.monitorOnly.bgLight,
          border: EXPOSURE_COLOR_CLASSES.monitorOnly.border,
          text: EXPOSURE_COLOR_CLASSES.monitorOnly.text,
          badge: EXPOSURE_COLOR_CLASSES.monitorOnly.bg,
          iconBg: 'bg-yellow-50'
        };
      case 'Low Exposure':
        return {
          bg: EXPOSURE_COLOR_CLASSES.lowExposure.bgLight,
          border: EXPOSURE_COLOR_CLASSES.lowExposure.border,
          text: EXPOSURE_COLOR_CLASSES.lowExposure.text,
          badge: EXPOSURE_COLOR_CLASSES.lowExposure.bg,
          iconBg: 'bg-green-50'
        };
    }
  };

  const colors = getColorClasses(categoryStatus.text as 'Pay Attention' | 'Monitor Only' | 'Low Exposure');

  const getExposureCardStyle = (type: 'payAttention' | 'monitorOnly' | 'lowExposure') => {
    const styles = {
      payAttention: {
        bg: 'bg-red-50/50',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        color: EXPOSURE_COLORS.payAttention
      },
      monitorOnly: {
        bg: 'bg-yellow-50/50',
        border: 'border-yellow-200',
        iconBg: 'bg-yellow-100',
        color: EXPOSURE_COLORS.monitorOnly
      },
      lowExposure: {
        bg: 'bg-green-50/50',
        border: 'border-green-200',
        iconBg: 'bg-green-100',
        color: EXPOSURE_COLORS.lowExposure
      }
    };
    return styles[type];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border-2`}>
          <div className={colors.text}>
            {getClassificationIcon(categoryStatus.text as 'Pay Attention' | 'Monitor Only' | 'Low Exposure')}
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Category Classification
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">How this category was evaluated</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Overall Classification Badge */}
        <div className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 shadow-sm transition-all hover:shadow-md`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${colors.iconBg}`}>
                {getClassificationIcon(categoryStatus.text as 'Pay Attention' | 'Monitor Only' | 'Low Exposure')}
              </div>
              <span className="text-sm font-semibold text-gray-700">Overall Classification</span>
            </div>
            <span 
              className={`${colors.badge} text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm`}
            >
              {categoryStatus.text}
            </span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {getClassificationReason()}
          </p>
        </div>

        {/* Breakdown of Chemical Exposures */}
        <div>
          <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Breakdown of Your Chemical Exposures
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pay Attention */}
            {payAttentionCount > 0 && (() => {
              const style = getExposureCardStyle('payAttention');
              return (
                <div className={`${style.bg} border-2 ${style.border} rounded-xl p-4 transition-all hover:shadow-md hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${style.iconBg}`}>
                        <svg className="w-4 h-4" style={{ color: style.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Pay Attention</span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: style.color }}>
                      {payAttentionCount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    60th-100th percentile
                  </p>
                </div>
              );
            })()}

            {/* Monitor Only */}
            {monitorOnlyCount > 0 && (() => {
              const style = getExposureCardStyle('monitorOnly');
              return (
                <div className={`${style.bg} border-2 ${style.border} rounded-xl p-4 transition-all hover:shadow-md hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${style.iconBg}`}>
                        <svg className="w-4 h-4" style={{ color: style.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Monitor Only</span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: style.color }}>
                      {monitorOnlyCount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    30th-60th percentile
                  </p>
                </div>
              );
            })()}

            {/* Low Exposure */}
            {lowExposureCount > 0 && (() => {
              const style = getExposureCardStyle('lowExposure');
              return (
                <div className={`${style.bg} border-2 ${style.border} rounded-xl p-4 transition-all hover:shadow-md hover:scale-[1.02]`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${style.iconBg}`}>
                        <svg className="w-4 h-4" style={{ color: style.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Low Exposure</span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: style.color }}>
                      {lowExposureCount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    0th-30th percentile
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-white border border-gray-200">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-gray-800">
              How This Classification Works
            </h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Each chemical in this category is compared to the general population and assigned to an exposure level based on where your levels fall. 
            The category's overall classification is determined by the pattern of your individual chemical exposures:
          </p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 bg-white/60 rounded-lg p-3 border border-gray-200/50">
              <div className="p-1 rounded bg-red-100 mt-0.5 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
              </div>
              <div>
                <p className="text-sm text-gray-800 font-medium mb-0.5">
                  <span className="font-semibold" style={{ color: EXPOSURE_COLORS.payAttention }}>Pay Attention:</span> 3 or more chemicals in the high exposure range (60th-100th percentile)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/60 rounded-lg p-3 border border-gray-200/50">
              <div className="p-1 rounded bg-yellow-100 mt-0.5 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EXPOSURE_COLORS.monitorOnly }}></div>
              </div>
              <div>
                <p className="text-sm text-gray-800 font-medium mb-0.5">
                  <span className="font-semibold" style={{ color: EXPOSURE_COLORS.monitorOnly }}>Monitor Only:</span> 3 or more chemicals in the moderate range (30th-60th percentile), or 1+ chemical in the high range
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/60 rounded-lg p-3 border border-gray-200/50">
              <div className="p-1 rounded bg-green-100 mt-0.5 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EXPOSURE_COLORS.lowExposure }}></div>
              </div>
              <div>
                <p className="text-sm text-gray-800 font-medium mb-0.5">
                  <span className="font-semibold" style={{ color: EXPOSURE_COLORS.lowExposure }}>Low Exposure:</span> Fewer than 3 moderate-range chemicals and no high-range chemicals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

