import React, { ReactNode } from 'react';

export function PageTransition({ children, keyProp }: { children: ReactNode, keyProp?: string }) {
  return (
    <div key={keyProp} className="w-full h-full animate-slide-up-page">
      {children}
    </div>
  );
}
