import React from 'react';

/**
 * @interface ProgressBarProps
 * @property {number} value - The current progress value.
 * @property {number} [max=100] - The maximum progress value. Defaults to 100.
 * @property {string} [label] - Accessible label describing the progress bar.
 * @property {string} [className] - Optional additional CSS classes for the container.
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

/**
 * @function ProgressBar
 * @description A customizable, accessible progress bar component styled with Tailwind CSS.
 * Handles value clamping and provides smooth visual transitions.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  className = '',
}) => {
  // Clamp value between 0 and max to ensure logical and visual integrity
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={`h-2.5 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}
    >
      <div
        data-testid="progress-fill"
        className="h-full bg-blue-600 transition-all duration-300 ease-in-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default ProgressBar;