import { useEffect, useRef, useState } from 'react'
import { Camera, AlertCircle, Video, VideoOff, CheckCircle2 } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface BarcodeScannerProps {
  onScan: (code: string) => void
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [lastScanned, setLastScanned] = useState<string>('')
  const [scanSuccess, setScanSuccess] = useState(false)

  const startCamera = async () => {
    try {
      setError('')
      setScanSuccess(false)

      // Initialize the code reader if not already done
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader()
      }

      const codeReader = codeReaderRef.current

      // Get available video devices
      const videoInputDevices = await codeReader.listVideoInputDevices()

      if (videoInputDevices.length === 0) {
        setError('No camera found on this device')
        return
      }

      // Prefer back camera if available (for mobile devices)
      const backCamera = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('environment')
      )
      const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId

      setIsScanning(true)

      // Start decoding from video device
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const code = result.getText()
            console.log('Barcode detected:', code)

            // Prevent duplicate scans
            if (code !== lastScanned) {
              setLastScanned(code)
              setScanSuccess(true)
              onScan(code)

              // Show success indicator briefly
              setTimeout(() => setScanSuccess(false), 2000)
            }
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error)
          }
        }
      )
    } catch (err: any) {
      console.error('Camera error:', err)
      setError('Unable to access camera. Please ensure camera permissions are granted.')
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    setIsScanning(false)
    setLastScanned('')
    setScanSuccess(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Video Feed */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Camera not started</p>
            </div>
          </div>
        )}

        {/* Scanning Indicator */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scan Line Animation */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className={`h-0.5 animate-pulse shadow-lg ${scanSuccess ? 'bg-green-500 shadow-green-500/50' : 'bg-blue-500 shadow-blue-500/50'}`}></div>
            </div>

            {/* Corner Guides */}
            <div className={`absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 rounded-lg transition-colors ${scanSuccess ? 'border-green-500' : 'border-blue-500'}`}>
              <div className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 transition-colors ${scanSuccess ? 'border-green-500' : 'border-blue-500'}`}></div>
              <div className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 transition-colors ${scanSuccess ? 'border-green-500' : 'border-blue-500'}`}></div>
              <div className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 transition-colors ${scanSuccess ? 'border-green-500' : 'border-blue-500'}`}></div>
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 transition-colors ${scanSuccess ? 'border-green-500' : 'border-blue-500'}`}></div>
            </div>

            {/* Success Indicator */}
            {scanSuccess && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg animate-pulse">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Barcode Detected!</span>
              </div>
            )}

            {/* Scanning Status */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">
                {scanSuccess ? 'Barcode Scanned' : 'Scanning...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to Use</p>
            <p>1. Click <strong>Start Camera</strong> to enable barcode scanning</p>
            <p>2. Point camera at a batch barcode (e.g., printed label from receiving)</p>
            <p>3. The scanner will automatically detect and look up the batch</p>
            <p className="mt-2">Alternatively, use <strong>Manual Entry</strong> below to type the batch number.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isScanning ? (
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Video className="w-4 h-4" />
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <VideoOff className="w-4 h-4" />
            Stop Camera
          </button>
        )}
      </div>
    </div>
  )
}
