import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/components/providers/auth-provider";

const dancing = localFont({
  src: "fonts/Handscript.ttf",
  variable: "--font-dancing",
});

const editorial = localFont({
  src: [
    {
      path: "fonts/ppeditorial/PPEditorialNew-Regular-BF644b214ff145f.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "fonts/ppeditorial/PPEditorialNew-Italic-BF644b214fb0c0a.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "fonts/ppeditorial/PPEditorialNew-Ultrabold-BF644b21500840c.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "fonts/ppeditorial/PPEditorialNew-UltraboldItalic-BF644b214faef01.otf",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-editorial",
});

export const metadata: Metadata = {
  title: "BrandCove — Hire the Creative Talent You Need",
  description:
    "A curated marketplace of the six creative roles every early-stage founder needs. Vetted talent. No noise. Just the right hire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dancing.variable} ${editorial.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className={`${dancing.variable} ${editorial.variable} min-h-full flex flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
