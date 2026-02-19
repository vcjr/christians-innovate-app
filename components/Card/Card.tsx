import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * A reusable Card component deduced from Next.js structural patterns.
 * Uses composition and conditional slot rendering.
 */
const Card = ({ children, title, footer, className }: CardProps) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden transition-shadow duration-200 ${className || ''}`}>
      {title && (
        <header className="px-6 py-4 border-b border-gray-200 font-semibold text-lg">
          {title}
        </header>
      )}
      
      <div className="p-6 flex-1">
        {children}
      </div>

      {footer && (
        <footer className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default Card;
