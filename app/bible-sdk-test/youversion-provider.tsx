"use client";

import { type ReactNode } from "react";
import { YouVersionProvider as HooksYouVersionProvider } from "@youversion/platform-react-hooks";

interface YouVersionProviderProps {
  children: ReactNode;
}

// Tiny wrapper so the test page can use both UI + hooks against the same config
export function YouVersionProvider({ children }: YouVersionProviderProps) {
  const appKey = process.env.NEXT_PUBLIC_YOUVERSION_APP_KEY ?? "";
  const apiHost = process.env.NEXT_PUBLIC_YOUVERSION_API_HOST ?? "api.youversion.com";

  return (
    <HooksYouVersionProvider appKey={appKey} apiHost={apiHost} includeAuth={false}>
      {children}
    </HooksYouVersionProvider>
  );
}
