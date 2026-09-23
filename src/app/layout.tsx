
'use client';

import './globals.css';
import { initializeFirebase, FirebaseClientProvider } from '@/firebase';
import { FullscreenLock } from '@/components/fullscreen-lock';
import { Toaster } from '@/components/ui/toaster';

const { firebaseApp, firestore, auth } = initializeFirebase();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background selection:bg-accent/30 selection:text-accent-foreground">
        <FirebaseClientProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth}>
          <FullscreenLock>
            {children}
          </FullscreenLock>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
