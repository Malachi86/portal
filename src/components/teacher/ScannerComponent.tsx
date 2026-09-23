
"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

import { Button } from "@/components/ui/button";
import { Camera, X, Smartphone } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { toast } from "sonner";

interface ScannerComponentProps {
  onScan: (decodedText: string) => void;
  mode: "in" | "out";
}

export function ScannerComponent({ onScan, mode }: ScannerComponentProps) {

  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanCooldown = useRef(false);

  const readerId = useRef(
    `qr-reader-${Math.random().toString(36).substring(2, 9)}`
  );

  /* =========================================
     CLEANUP ON UNMOUNT
  ========================================= */

  useEffect(() => {

    return () => {

      if (scannerRef.current) {

        scannerRef.current.stop()
          .catch(()=>{})
          .finally(()=>{
            scannerRef.current = null;
          });

      }

    };

  }, []);

  /* =========================================
     START SCANNER
  ========================================= */

  const startScan = async () => {

    if (scannerRef.current) return;

    setIsScanning(true);
    setLoadingCamera(true);

    await new Promise(r => setTimeout(r, 200));

    try {

      const element =
        document.getElementById(readerId.current);

      if (!element)
        throw new Error("Scanner container missing");

      // Enable Universal Scanning (QR + All Barcodes)
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_8,
      ];

      const html5QrCode =
        new Html5Qrcode(readerId.current, { 
          formatsToSupport: formatsToSupport,
          verbose: false 
        });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1
        },

        (decodedText) => {

          if (scanCooldown.current) return;

          scanCooldown.current = true;

          onScan(decodedText);

          toast.success("Signal Captured");

          stopScan();

          setTimeout(()=>{
            scanCooldown.current = false;
          },1500);

        },

        () => {}

      );

      setHasCameraPermission(true);

      toast.info("Camera Ready");

    } catch (err) {

      console.error("Scanner error:", err);

      setHasCameraPermission(false);

      setIsScanning(false);

      toast.error("Camera access failed");

    } finally {

      setLoadingCamera(false);

    }

  };

  /* =========================================
     STOP SCANNER
  ========================================= */

  const stopScan = async () => {

    try {

      if (scannerRef.current) {

        await scannerRef.current.stop();

        scannerRef.current.clear();

        scannerRef.current = null;

      }

    } catch (err) {

      console.error("Stop scanner error", err);

    }

    setIsScanning(false);

  };

  /* =========================================
     UI
  ========================================= */

  return (

    <div className="w-full space-y-4">

      {!isScanning ? (

        <div className="space-y-4">

          <Button
            onClick={startScan}
            variant="outline"
            className="
            w-full
            h-40
            border-dashed
            border-4
            border-primary/20
            flex
            flex-col
            gap-4
            hover:bg-primary/5
            hover:border-primary/40
            rounded-[2.5rem]
            group
            transition-all
            "
          >

            <div className="
            p-5
            bg-primary/10
            rounded-2xl
            group-hover:bg-primary
            group-hover:text-white
            transition
            ">

              <Camera className="h-10 w-10" />

            </div>

            <div className="text-center">

              <span className="
              block
              font-black
              uppercase
              tracking-widest
              text-xs
              text-muted-foreground
              ">

                Activate Universal Scanner

              </span>

              <span className="
              text-[9px]
              font-bold
              text-muted-foreground/60
              uppercase
              tracking-tighter
              mt-1
              flex
              items-center
              justify-center
              gap-1
              ">

                <Smartphone className="h-3 w-3" />

                QR & BARCODE SUPPORTED

              </span>

            </div>

          </Button>

          {hasCameraPermission === false && (

            <Alert
              variant="destructive"
              className="
              rounded-2xl
              border-destructive/20
              bg-destructive/5
              "
            >

              <AlertTitle className="
              font-black
              uppercase
              tracking-widest
              text-xs
              ">

                Camera Permission Required

              </AlertTitle>

              <AlertDescription className="text-xs">

                Please allow camera access in your browser settings.

              </AlertDescription>

            </Alert>

          )}

        </div>

      ) : (

        <div className="relative">

          <div
            id={readerId.current}
            className="
            w-full
            aspect-square
            rounded-[3rem]
            overflow-hidden
            border-8
            border-primary/10
            bg-black
            "
          />

          {/* Loading Camera */}

          {loadingCamera && (

            <div className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            text-white
            bg-black/60
            rounded-[3rem]
            ">

              Initializing Camera...

            </div>

          )}

          {/* Close Button */}

          <Button
            onClick={stopScan}
            size="icon"
            className="
            absolute
            -top-4
            -right-4
            bg-primary
            text-white
            rounded-full
            border-4
            border-white
            h-12
            w-12
            "
          >

            <X className="h-6 w-6" />

          </Button>

          {/* Scanner Status */}

          <div className="
          absolute
          bottom-8
          left-0
          right-0
          flex
          justify-center
          px-6
          ">

            <div className="
            bg-primary/90
            backdrop-blur
            text-white
            px-6
            py-2
            rounded-full
            text-[10px]
            font-black
            uppercase
            tracking-widest
            flex
            items-center
            gap-2
            ">

              <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>

              Active Capture Mode

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
