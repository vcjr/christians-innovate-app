'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Info, X, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { NOTICE_REGISTRY, NoticeType } from '@/types/notices';

/**
 * @component NoticeHandler
 * @description Detects and displays "flash" notices set by the middleware via cookies.
 * Features a right-aligned layout, animated progress bar, and inclusive hover-pause logic.
 * Content is driven by a secure registry to prevent injection attacks.
 * Pillar: Security - Prevents notice forgery by relying on server-set cookies.
 * Pillar: Performance - Uses CSS animation play-state for smooth, efficient pausing/resuming.
 */

const TYPE_MAP: Record<NoticeType, {
  container: string;
  icon: any;
  iconColor: string;
  bar: string;
  title: string;
  message: string;
  role: 'status' | 'alert';
}> = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    bar: 'bg-green-500',
    title: 'text-green-900',
    message: 'text-green-700',
    role: 'status',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    bar: 'bg-blue-500',
    title: 'text-blue-900',
    message: 'text-blue-700',
    role: 'status',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    bar: 'bg-amber-500',
    title: 'text-amber-900',
    message: 'text-amber-700',
    role: 'alert',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600',
    bar: 'bg-red-500',
    title: 'text-red-900',
    message: 'text-red-700',
    role: 'alert',
  },
};

export function NoticeHandler() {
  const [slug, setSlug] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // 1. Check for the flash cookie
    const val = Cookies.get('next_notice');
    if (val) {
      // Pillar: Security - Only set slug if it exists in our registry
      if (NOTICE_REGISTRY[val]) {
        setSlug(val);
      }
      // 2. Immediate Purge (Flash Logic): Ensure notice only shows once
      Cookies.remove('next_notice', { path: '/' });
    }
  }, []);

  const config = slug ? NOTICE_REGISTRY[slug] : null;
  if (!config) return null;

  const styles = TYPE_MAP[config.type];
  const Icon = styles.icon;

  return (
    <>
      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .animate-shrink {
          animation: shrink 10s linear forwards;
          transform-origin: left;
        }
      `}</style>
      <div 
        role={styles.role} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed top-16 right-0 z-50 w-full md:w-3/5 animate-in fade-in slide-in-from-right-4 duration-500"
      >
        <div className={`m-4 ${styles.container} border rounded-lg shadow-xl overflow-hidden`}>
          <div className="p-4 flex items-start gap-3">
            <Icon className={`h-5 w-5 ${styles.iconColor} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${styles.title}`}>{config.title}</p>
              <p className={`text-sm ${styles.message} mt-1 leading-relaxed`}>
                {config.message}
              </p>
            </div>
            <button 
              onClick={() => setSlug(null)}
              className={`${styles.iconColor} opacity-70 hover:opacity-100 transition-colors p-1 rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Pillar: Accessibility - Decorative progress bar hidden from screen readers */}
          <div 
            aria-hidden="true"
            onAnimationEnd={() => setSlug(null)}
            className={`h-1 ${styles.bar} animate-shrink`}
            style={{ animationPlayState: isHovered ? 'paused' : 'running' }}
          />
        </div>
      </div>
    </>
  );
}