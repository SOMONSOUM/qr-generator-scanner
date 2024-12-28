import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Koh_Santepheap } from "next/font/google";

const koh_santepheap = Koh_Santepheap({
  subsets: ["khmer", "latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={koh_santepheap.className}>
        <Toaster richColors />
        {children}
      </body>
    </html>
  );
}
