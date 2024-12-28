"use client";

import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { cn } from "@/app/lib/utils";
import {
  CameraIcon,
  SwitchCameraIcon,
  Flashlight,
  CopyIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import useMediaQuery from "../hooks/use-media-query";

const QrScannerComponent = ({ size }: { size: number }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [qrdata, setQrdata] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [currentCamera, setCurrentCamera] = useState<"user" | "environment">(
    "environment"
  );
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [videoSize, setVideoSize] = useState({ width: size, height: size });
  const isMobile = useMediaQuery("(max-width: 768px)");

  const calculateScanRegion = (
    video: HTMLVideoElement
  ): QrScanner.ScanRegion => {
    const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
    const scanRegionSize = isMobile
      ? Math.round(smallestDimension * 0.9)
      : Math.round(smallestDimension * 0.8);
    const offsetX = Math.round((video.videoWidth - scanRegionSize) / 2);
    const offsetY = Math.round((video.videoHeight - scanRegionSize) / 2);

    return {
      x: offsetX,
      y: offsetY,
      width: scanRegionSize,
      height: scanRegionSize,
    };
  };

  useEffect(() => {
    const updateVideoSize = () => {
      if (videoRef.current) {
        const aspectRatio = window.innerWidth / window.innerHeight;
        let newWidth, newHeight;

        if (aspectRatio > 1) {
          // Landscape
          newHeight = Math.min(window.innerHeight * 0.7, size);
          newWidth = newHeight;
        } else {
          // Portrait
          newWidth = Math.min(window.innerWidth * 0.9, size);
          newHeight = newWidth;
        }

        setVideoSize({ width: newWidth, height: newHeight });
      }
    };

    updateVideoSize();
    window.addEventListener("resize", updateVideoSize);

    return () => {
      window.removeEventListener("resize", updateVideoSize);
    };
  }, [size]);

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
          {
            returnDetailedScanResult: true,
            highlightScanRegion: false,
            highlightCodeOutline: true,
            calculateScanRegion,
            overlay: overlayRef.current || undefined,
          }
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
        "flex flex-col bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 shadow-lg"
      )}
    >
      <h2 className={cn("text-2xl sm:text-3xl font-bold text-gray-800 mb-4")}>
        QR Code Scanner
      </h2>
      <div className={cn("space-y-4 sm:space-y-6")}>
        <button
          onClick={() => fileRef.current?.click()}
          className={cn(
            "w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 sm:py-3 rounded-lg shadow-md transition text-sm sm:text-base"
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
            "w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 sm:py-3 rounded-lg shadow-md transition flex items-center justify-center text-sm sm:text-base"
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
                "flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-3 rounded-lg shadow-md transition flex items-center justify-center text-sm sm:text-base"
              )}
            >
              <SwitchCameraIcon className="mr-2" />
            </button>
            <button
              onClick={toggleFlashlight}
              className={cn(
                "flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 sm:py-3 rounded-lg shadow-md transition flex items-center justify-center text-sm sm:text-base",
                isFlashlightOn && "bg-yellow-700"
              )}
            >
              <Flashlight className="mr-2" />
            </button>
          </div>
        )}

        <div
          className={cn(
            "relative mx-auto",
            isCameraActive ? "block" : "hidden"
          )}
        >
          <video
            ref={videoRef}
            className={cn("rounded-lg border border-gray-300 shadow-lg")}
            width={videoSize.width}
            height={videoSize.height}
          />
          <motion.div
            ref={overlayRef}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{
              scale: [0.8, 1, 0.8],
              opacity: [0.5, 1, 0.5],
            }}
          >
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-[4px] border-l-[4px] border-white rounded-tl-3xl" />
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-[4px] border-r-[4px] border-white rounded-tr-3xl" />
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-[4px] border-l-[4px] border-white rounded-bl-3xl" />
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-[4px] border-r-[4px] border-white rounded-br-3xl" />
          </motion.div>
        </div>
      </div>
      {qrdata && (
        <div
          className={cn(
            "relative mt-4 sm:mt-6 p-4 sm:p-6 bg-gray-100 border border-gray-300 rounded-lg shadow-md"
          )}
        >
          <button
            onClick={copyToClipboard}
            className={cn(
              "absolute top-2 right-2 sm:top-3 sm:right-3 p-2 text-gray-600 hover:text-gray-800 transition"
            )}
          >
            <CopyIcon />
          </button>
          <h3
            className={cn(
              "text-lg sm:text-xl font-semibold text-gray-800 text-center"
            )}
          >
            Scanned QR Data
          </h3>
          <p
            className={cn(
              "mt-2 text-gray-700 break-words text-sm sm:text-base"
            )}
          >
            {qrdata}
          </p>
        </div>
      )}
    </section>
  );
};

export default QrScannerComponent;
