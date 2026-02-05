import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void
  onScanFailure?: (error: any) => void
}

export default function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [])

  const startScanning = () => {
    setIsScanning(true)
    // Small timeout to allow DOM to render the container
    setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        )
        scannerRef.current = scanner
        
        scanner.render(
            (decodedText) => {
                onScanSuccess(decodedText)
                stopScanning()
            },
            (errorMessage) => {
                // console.log(errorMessage) // Ignore errors for UI cleanliness
            }
        )
    }, 100)
  }

  const stopScanning = () => {
    if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error).finally(() => {
            setIsScanning(false)
            scannerRef.current = null
        })
    } else {
        setIsScanning(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {!isScanning && (
        <Button onClick={startScanning} className="w-full h-32 flex flex-col gap-2">
            <span className="text-4xl">📷</span>
            <span className="text-lg">Scan Barcode</span>
        </Button>
      )}

      {isScanning && (
        <Card className="w-full p-4 relative">
            <div id="reader" className="w-full"></div>
            <Button 
                variant="destructive" 
                size="sm" 
                onClick={stopScanning}
                className="mt-4 w-full"
            >
                Stop Camera
            </Button>
        </Card>
      )}
    </div>
  )
}
