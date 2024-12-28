"use client";

import QrGenerator from "@/components/qr-generator";
import QRScanner from "@/components/qr-scanner";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Home() {
  const [size, setSize] = useState<number>(350);

  return (
    <main
      className={cn(
        "flex flex-col items-center justify-center min-h-screen p-8",
        "bg-gradient-to-r from-blue-50 to-gray-100"
      )}
    >
      <div
        className={cn(
          "w-full max-w-4xl bg-white shadow-2xl rounded-lg p-8",
          "grid grid-cols-1 md:grid-cols-2 gap-8"
        )}
      >
        {/* QR Code Scanner Section */}
        <QRScanner size={size} />

        {/* QR Code Generator Section */}
        <QrGenerator size={size} setSize={setSize} />
      </div>
    </main>
  );
}
