'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card/Card';
import Cookies from 'js-cookie';
import confetti from 'canvas-confetti';

/**
 * @function SuccessPage
 * @description Dedicated completion page for the onboarding flow.
 * Implements a client-side guardrail based on localStorage to ensure 
 * the user has just completed the onboarding sequence.
 */
export default function SuccessPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const status = localStorage.getItem('onboarding_status');
    
    if (status !== 'complete') {
      // Security Guardrail: Bounce back to start if not complete
      router.replace('/onboarding?step=1');
    } else {
      // Pillar: Reliability - Keep tokens until explicit exit to prevent redirect loops
      setIsAuthorized(true);
      // Focus management for A11y
      document.title = "Onboarding Complete - Christians Innovate";

      // Trigger Celebration
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#16a34a', '#ffffff'], // Blue, Green, White
          disableForReducedMotion: true
        });
      }
    }
  }, [router]);

  if (!isAuthorized) return null;

  const handleGoToDashboard = () => {
    // Pillar: Security - Final cleanup happens only on explicit exit
    Cookies.remove('sb_success_auth');
    localStorage.removeItem('onboarding_status');

    // Pillar: UX - Replace history entry so user cannot go "Back" to success
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <Card title="Success!">
          <div className="flex flex-col items-center text-center space-y-6 py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl">
              ✓
            </div>
            <h1 tabIndex={-1} className="text-2xl font-bold text-gray-900 outline-none">
              Thank You for Joining!
            </h1>
            <p className="text-gray-600">
              Your profile has been set up successfully. You are now ready to explore the community and start innovating.
            </p>
            <button
              onClick={handleGoToDashboard}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}