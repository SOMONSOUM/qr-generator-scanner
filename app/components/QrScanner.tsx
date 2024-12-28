"use client";

import { useState, useRef } from "react";
import QrScanner from "qr-scanner";
import { cn } from "@/app/lib/utils";
import { CameraIcon, SwitchCameraIcon, Flashlight } from "lucide-react";

const QrScannerComponent = ({ size }: { size: number }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const [qrdata, setQrdata] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [currentCamera, setCurrentCamera] = useState<"user" | "environment">(
    "environment"
  );
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const responseQrdata = await QrScanner.scanImage(e.target.files[0], {
        returnDetailedScanResult: true,
      });
      setQrdata(responseQrdata.data);
    }
  };

  const copyToClipboard = () => {
    if (qrdata) {
      navigator.clipboard.writeText(qrdata);
    }
  };

  const startCamera = async () => {
    if (videoRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: currentCamera },
        });
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((error) => {
            console.error("Error playing video:", error);
          });
        };

        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            setQrdata(result.data);
            qrScannerRef.current?.stop();
            setIsCameraActive(false);
            setIsFlashlightOn(false);
          },
          { returnDetailedScanResult: true }
        );

        qrScannerRef.current.start();
        setIsCameraActive(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsFlashlightOn(false);
  };

  const switchCamera = async () => {
    setCurrentCamera(currentCamera === "environment" ? "user" : "environment");
    await startCamera();
  };

  const toggleFlashlight = async () => {
    if (qrScannerRef.current) {
      try {
        if (isFlashlightOn) {
          await qrScannerRef.current.turnFlashOff();
        } else {
          await qrScannerRef.current.turnFlashOn();
        }
        setIsFlashlightOn(!isFlashlightOn);
      } catch (error) {
        console.error("Error toggling flashlight:", error);
      }
    }
  };

  return (
    <section
      className={cn(
        "flex flex-col bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-lg"
      )}
    >
      <h2 className={cn("text-3xl font-bold text-gray-800 mb-4")}>
        QR Code Scanner
      </h2>
      <div className={cn("space-y-6")}>
        <button
          onClick={() => fileRef.current?.click()}
          className={cn(
            "w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg shadow-md transition"
          )}
        >
          Upload QR Code
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileChange}
          className={cn("hidden")}
        />

        <button
          onClick={isCameraActive ? stopCamera : startCamera}
          className={cn(
            "w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg shadow-md transition flex items-center justify-center"
          )}
        >
          <CameraIcon className="mr-2" />
          {isCameraActive ? "Stop Camera" : "Scan QR Code"}
        </button>

        {isCameraActive && (
          <div className={cn("flex space-x-4")}>
            <button
              onClick={switchCamera}
              className={cn(
                "flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-md transition flex items-center justify-center"
              )}
            >
              <SwitchCameraIcon className="mr-2" />
              Switch Camera
            </button>
            <button
              onClick={toggleFlashlight}
              className={cn(
                "flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg shadow-md transition flex items-center justify-center",
                isFlashlightOn && "bg-yellow-700"
              )}
            >
              <Flashlight className="mr-2" />
              {isFlashlightOn ? "Turn Off Flashlight" : "Turn On Flashlight"}
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          className={cn(
            `mx-auto rounded-lg border border-gray-300 shadow-lg mt-4`
          )}
          width={isCameraActive ? size : "0px"}
          height={isCameraActive ? size : "0px"}
        />
      </div>
      {qrdata && (
        <div
          className={cn(
            "relative mt-6 p-6 bg-gray-100 border border-gray-300 rounded-lg shadow-md"
          )}
        >
          <button
            onClick={copyToClipboard}
            className={cn(
              "absolute top-3 right-3 p-2 text-gray-600 hover:text-gray-800 transition"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={cn("h-6 w-6")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16h8M8 12h8M8 8h8m-4-4v4M4 16v4h4M4 8v4M4 4h4v4M16 4h4v4m0 8v4h-4m4 0h-4m-8 4h8m4-4v4m0-8v4M4 16v4"
              />
            </svg>
          </button>
          <h3 className={cn("text-xl font-semibold text-gray-800 text-center")}>
            Scanned QR Data
          </h3>
          <p className={cn("mt-2 text-gray-700 break-words")}>{qrdata}</p>
        </div>
      )}
    </section>
  );
};

export default QrScannerComponent;
