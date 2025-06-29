import * as faceapi from 'face-api.js';
import { FacialProfile } from '../types/database.types';

// Path to face-api.js models
const MODELS_PATH = '/models';

// Face detection options
const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({ 
  minConfidence: 0.5 
});

// Initialize flag to prevent multiple initializations
let isInitialized = false;

/**
 * Initialize face-api models
 */
export const initFaceRecognition = async (): Promise<void> => {
  if (isInitialized) return;
  
  try {
    // Load required models
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH)
    ]);
    
    isInitialized = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    throw error;
  }
};

/**
 * Detect faces in an image
 */
export const detectFaces = async (
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>[]> => {
  if (!isInitialized) await initFaceRecognition();
  
  return faceapi
    .detectAllFaces(image, faceDetectionOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();
};

/**
 * Get face descriptor from a detected face
 */
export const getFaceDescriptor = async (
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> => {
  const detections = await detectFaces(image);
  
  if (detections.length === 0) {
    return null;
  }
  
  // Return descriptor of the face with highest confidence
  const bestMatch = detections.reduce((prev, current) => 
    (prev.detection.score > current.detection.score) ? prev : current
  );
  
  // Access descriptor property with type assertion
  return (bestMatch as any).descriptor;
};

/**
 * Create a face matcher with labeled facial profiles
 */
export const createFaceMatcher = (
  facialProfiles: FacialProfile[]
): faceapi.FaceMatcher => {
  const labeledDescriptors = facialProfiles.map(profile => {
    // Convert stored JSON descriptor back to Float32Array
    const descriptorArray = Object.values(profile.face_descriptor);
    const descriptor = new Float32Array(descriptorArray as number[]);
    
    return new faceapi.LabeledFaceDescriptors(
      profile.staff_id.toString(),
      [descriptor]
    );
  });
  
  return new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is the distance threshold
};

/**
 * Recognize a face against stored facial profiles
 */
export const recognizeFace = (
  faceDescriptor: Float32Array,
  faceMatcher: faceapi.FaceMatcher
): { staffId: number; distance: number } | null => {
  try {
    const match = faceMatcher.findBestMatch(faceDescriptor);
    
    if (match.label === 'unknown') {
      return null;
    }
    
    return {
      staffId: parseInt(match.label, 10),
      distance: match.distance
    };
  } catch (error) {
    console.error('Error recognizing face:', error);
    return null;
  }
};

/**
 * Check if a face is "live" (anti-spoofing)
 * This is a placeholder - real implementation would use more complex techniques
 */
export const checkLiveness = async (
  video: HTMLVideoElement
): Promise<boolean> => {
  // In a real implementation, this would use more sophisticated techniques
  // such as eye blink detection, head movement tracking, etc.
  
  // For now, just check if we detect a face consistently
  try {
    const detection1 = await detectFaces(video);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const detection2 = await detectFaces(video);
    
    // Check if we have detections both times
    return detection1.length > 0 && detection2.length > 0;
  } catch (error) {
    console.error('Error checking liveness:', error);
    return false;
  }
}; 