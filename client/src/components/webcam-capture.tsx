import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Video, RotateCcw, AlertCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface WebcamCaptureProps {
  onPhotoCapture: (photoData: string) => void;
}

export default function WebcamCapture({ onPhotoCapture }: WebcamCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Check if camera is available on mount
  useEffect(() => {
    const checkCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCamera(false);
          setCameraError("Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.");
          return;
        }

        // Check if we're in a secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
          setCameraError("Camera access requires HTTPS. Please access this site using HTTPS or from localhost.");
          setHasCamera(false);
          return;
        }

        // Try to enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          setHasCamera(false);
          setCameraError("No camera detected. Please connect a camera and refresh the page.");
        } else {
          setHasCamera(true);
          setCameraError(null);
        }
      } catch (error) {
        console.error("Error checking camera availability:", error);
        setHasCamera(false);
        setCameraError("Unable to check camera availability. Please ensure camera permissions are enabled.");
      }
    };

    checkCamera();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsLoading(true);
    
    try {
      console.log("Requesting camera access...");
      
      // Request camera permission with simplified constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      console.log("Camera stream obtained:", stream);
      const videoTracks = stream.getVideoTracks();
      console.log("Video tracks:", videoTracks);

      if (videoTracks.length > 0) {
        console.log("Video track settings:", videoTracks[0].getSettings());
      }

      streamRef.current = stream;
      
      // Wait for next tick to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          
          // Force play when metadata is loaded
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log("Video playing successfully");
                  setIsStreaming(true);
                  setIsLoading(false);
                })
                .catch(err => {
                  console.error("Error playing video:", err);
                  setCameraError("Unable to display camera preview. Please try again.");
                  setIsLoading(false);
                });
            }
          };
        }
      }, 100);
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      
      let errorMessage = "Unable to access camera. ";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += "Camera permission was denied. Please allow camera access in your browser settings and try again.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += "No camera found. Please connect a camera and try again.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += "Camera is already in use by another application. Please close other apps using the camera and try again.";
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += "Camera doesn't support the requested settings. Trying with default settings...";
      } else if (error.name === 'TypeError') {
        errorMessage += "Camera access is not supported in this browser or requires HTTPS.";
      } else {
        errorMessage += error.message || "Please check your camera settings and try again.";
      }
      
      setCameraError(errorMessage);
      setIsLoading(false);
      toast({
        title: "Camera access failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    
    // Reduce image size to max 640x480 to avoid payload too large errors
    const maxWidth = 640;
    const maxHeight = 480;
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    // Calculate new dimensions while maintaining aspect ratio
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = width * ratio;
      height = height * ratio;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, width, height);
    
    // Reduce quality to 0.6 for smaller file size
    const dataURL = canvas.toDataURL("image/jpeg", 0.6);
    setPhotoData(dataURL);
    onPhotoCapture(dataURL);
    stopCamera();
    
    toast({
      title: "Photo captured",
      description: "Your photo has been captured successfully for the visitor badge.",
    });
  }, [onPhotoCapture, stopCamera, toast]);

  const retakePhoto = useCallback(() => {
    setPhotoData(null);
    onPhotoCapture("");
    setCameraError(null);
    startCamera();
  }, [onPhotoCapture, startCamera]);

  const skipPhoto = useCallback(() => {
    setPhotoData(null);
    onPhotoCapture("");
    setCameraError(null);
    toast({
      title: "Photo skipped",
      description: "Continuing without photo. Badge will be generated without your picture.",
    });
  }, [onPhotoCapture, toast]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress the image
        const canvas = document.createElement("canvas");
        const maxWidth = 640;
        const maxHeight = 480;
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.6 quality
          const compressedDataURL = canvas.toDataURL("image/jpeg", 0.6);
          setPhotoData(compressedDataURL);
          onPhotoCapture(compressedDataURL);
          setCameraError(null);
          toast({
            title: "Photo uploaded",
            description: "Your photo has been uploaded successfully for the visitor badge.",
          });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onPhotoCapture, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900">Photo for Badge (Optional)</h4>
        <Camera className="text-primary text-xl" />
      </div>
      
      {cameraError && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {cameraError}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-gray-200 rounded-lg aspect-square max-w-xs mx-auto flex items-center justify-center overflow-hidden relative">
        {photoData ? (
          <img 
            src={photoData} 
            alt="Captured visitor photo" 
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay={true}
              playsInline={true}
              muted={true}
              className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            {!isStreaming && (
              <div className="text-center text-gray-500 p-4">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm">Starting camera...</p>
                  </>
                ) : (
                  <>
                    <Camera className="mx-auto text-4xl mb-2" />
                    <p className="text-sm">
                      {hasCamera === false 
                        ? "Camera not available" 
                        : "Camera preview will appear here"}
                    </p>
                    {hasCamera === false && (
                      <p className="text-xs mt-2 text-gray-400">
                        You can still sign in without a photo
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="flex flex-col gap-3">
        {!isStreaming && !photoData && (
          <>
            <div className="flex justify-center space-x-4">
              <Button
                type="button"
                onClick={startCamera}
                className="btn-primary"
                disabled={hasCamera === false || isLoading}
              >
                <Video className="mr-2 h-4 w-4" />
                {isLoading ? "Starting..." : hasCamera === false ? "Camera Unavailable" : "Start Camera"}
              </Button>
              
              <label htmlFor="photo-upload">
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary hover:text-white cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </label>
            </div>
            
            {(hasCamera === false || cameraError) && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={skipPhoto}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Continue Without Photo
                </Button>
              </div>
            )}
          </>
        )}
        
        {isStreaming && !photoData && (
          <>
            <Button
              type="button"
              onClick={capturePhoto}
              className="btn-success"
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
            <Button
              type="button"
              onClick={stopCamera}
              variant="secondary"
            >
              Cancel
            </Button>
          </>
        )}
        
        {photoData && (
          <Button
            type="button"
            onClick={retakePhoto}
            variant="outline"
            className="text-primary border-primary hover:bg-primary hover:text-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Photo
          </Button>
        )}
      </div>
    </div>
  );
}
