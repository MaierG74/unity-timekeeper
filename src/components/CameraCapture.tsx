import React, { useRef, useState, useEffect } from 'react';
import { initFaceRecognition, detectFaces } from '../facial-recognition/face-recognition.service';

interface CameraCaptureProps {
  onCapture?: (faceDescriptor: Float32Array) => void;
  showDetection?: boolean;
  width?: number;
  height?: number;
  onStatusChange?: (status: 'initializing' | 'loading_models' | 'starting_camera' | 'active' | 'error') => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  showDetection = true,
  width = 640,
  height = 480,
  onStatusChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'initializing' | 'loading_models' | 'starting_camera' | 'active' | 'error'>('initializing');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize face recognition
  useEffect(() => {
    const init = async () => {
      try {
        setCameraStatus('loading_models');
        onStatusChange?.('loading_models');
        await initFaceRecognition();
        setIsInitialized(true);
      } catch (err) {
        setError('Failed to initialize face recognition. Please refresh the page.');
        setCameraStatus('error');
        onStatusChange?.('error');
        console.error(err);
      }
    };

    init();

    // Clean up on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start camera when initialized
  // Function to start the camera
  const startCamera = async () => {
    setError(null); // Clear previous errors
    setCameraStatus('starting_camera');
    onStatusChange?.('starting_camera');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setCameraStatus('active');
      onStatusChange?.('active');
    } catch (err) {
      setError('Camera access denied or not available.');
      setCameraStatus('error');
      onStatusChange?.('error');
      console.error(err);
    }
  };

  // Start camera when initialized
  useEffect(() => {
    if (isInitialized) {
      startCamera();
    }
  }, [isInitialized, width, height]);

  // Draw face detection on canvas when video is playing
  useEffect(() => {
    if (!isInitialized || !stream || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    let animationId: number;

    const detectFacesInVideo = async () => {
      if (video.paused || video.ended) return;

      // Set canvas dimensions to match the video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Detect faces
      const detections = await detectFaces(video);

      // Clear canvas
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // Suppress readback warning by using save/restore
        const originalImageSmoothingEnabled = ctx.imageSmoothingEnabled;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video frame on canvas
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        

        if (showDetection && detections.length > 0) {
          // Draw detections
          detections.forEach(detection => {
            const box = detection.detection.box;
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(box.x, box.y, box.width, box.height);
            ctx.stroke();
          });
          
          // Restore context settings
          ctx.restore();
          ctx.imageSmoothingEnabled = originalImageSmoothingEnabled;
        }
      }

      // Schedule the next detection
      animationId = requestAnimationFrame(detectFacesInVideo);
    };

    video.addEventListener('play', detectFacesInVideo);

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      video.removeEventListener('play', detectFacesInVideo);
    };
  }, [isInitialized, stream, showDetection]);

  // Capture button handler
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const detections = await detectFaces(video);

      if (detections.length === 0) {
        setError('No face detected. Please position your face in front of the camera.');
        return;
      }

      // Get the descriptor with highest confidence
      const bestMatch = detections.reduce((prev, current) => 
        (prev.detection.score > current.detection.score) ? prev : current
      );

      // Access descriptor property with type assertion
      const descriptor = (bestMatch as any).descriptor;
      
      if (onCapture && descriptor) {
        onCapture(descriptor);
      }
    } catch (err) {
      setError('Failed to capture face. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="camera-capture">
      <div className="video-container" style={{ position: 'relative', width, height }}>
        {cameraStatus !== 'active' && (
          <div className="loading-overlay" style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10}}>
            <p>
              {cameraStatus === 'initializing' && 'Initializing...'}
              {cameraStatus === 'loading_models' && 'Loading Facial Models...'}
              {cameraStatus === 'starting_camera' && 'Starting Camera...'}
            </p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
          {error === 'Camera access denied or not available.' && (
            <button onClick={startCamera} className="restart-camera-button">
              Restart Camera
            </button>
          )}
        </div>
      )}

      <div className="camera-controls">
        <button onClick={handleCapture} disabled={!isInitialized || !stream || !!error}>
          Capture
        </button>
      </div>
    </div>
  );
};

export default CameraCapture; 