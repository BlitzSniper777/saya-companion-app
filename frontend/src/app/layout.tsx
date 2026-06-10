import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: "800",
});

export const metadata: Metadata = {
  title: "Saya - Your Genuine AI Best Friend",
  description: "Saya is not a chatbot. She's your genuine best friend — the one you call when everything falls apart. Always here. Always listening.",
  keywords: ["AI companion", "mental health", "chatbot", "friendship", "support"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} dark`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-bg text-text">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#111122",
                color: "#f0effa",
                border: "1px solid rgba(139, 92, 246, 0.18)",
                borderRadius: "14px",
                padding: "16px",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#f0effa",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#f0effa",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}