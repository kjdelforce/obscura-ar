import type { Metadata, Viewport } from 'next';
import React from 'react';
import './globals.css';

// React 19 / R3F runtime polyfill
if (typeof window !== 'undefined') {
  const internals =
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ||
    (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  if (internals && !internals.ReactCurrentBatchConfig) {
    internals.ReactCurrentBatchConfig = { transition: null };
  }
}

export const metadata: Metadata = {
  title: 'OBSCURA // THE BLEED',
  description: 'Web-based Augmented Reality Survival Horror Game',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-black text-white antialiased overflow-hidden">{children}</body>
    </html>
  );
}
