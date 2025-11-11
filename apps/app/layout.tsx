import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BrowserCompatibilityCheck from "@/components/BrowserCompatibilityCheck";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Photo Background Editor",
  description: "Remove and replace photo backgrounds with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Configure ONNX Runtime WASM paths before any modules load
              if (typeof window !== 'undefined') {
                window.onnxruntimeInitializeConfig = {
                  wasmPaths: '/onnx/'
                };
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <BrowserCompatibilityCheck>
          {children}
        </BrowserCompatibilityCheck>
      </body>
    </html>
  );
}
