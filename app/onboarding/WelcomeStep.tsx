import React from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

/**
 * @function WelcomeStep
 * @description The first step of the onboarding flow.
 */
const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      <h1 className="text-3xl font-bold text-gray-900">Welcome to Christians Innovate!</h1>
      <p className="text-lg text-gray-600 max-w-md">
        Let's get to know you better! We'll ask a few questions to help tailor your experience.
      </p>
      <button
        onClick={onNext}
        className="mt-4 w-full px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-300"
      >
        Get Started
      </button>
    </div>
  );
};

export default WelcomeStep;