'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { signOut } from '@/app/actions';
import { clearLocalSessionData } from '@/utils/auth/cleanup';

/**
 * @component SignOutButton
 * @description Orchestrates a secure sign-out by clearing browser storage before server-side session invalidation.
 * Pillar: Security - Prevents PII leakage by ensuring cleanup happens before redirect.
 */
export function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    try {
      // 1. Clear LocalStorage and IndexedDB (Browser side)
      console.log('Initiating sign out: Clearing local session data...');
      await clearLocalSessionData();
      
      // 2. Trigger Server Action for session invalidation and redirect
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Sign Out"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {isPending ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}