declare module 'react-progressbar-semicircle' {
  import { FC } from 'react';

  interface SemiCircleProgressBarProps {
    percentage: number;
    stroke?: string;
    strokeWidth?: number;
    background?: string;
    diameter?: number;
    orientation?: 'up' | 'down';
    direction?: 'left' | 'right';
    showPercentValue?: boolean;
  }

  const SemiCircleProgressBar: FC<SemiCircleProgressBarProps>;
  export default SemiCircleProgressBar;
}

