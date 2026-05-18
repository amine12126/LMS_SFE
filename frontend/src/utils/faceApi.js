import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let loadPromise = null;

export const loadFaceModels = async () => {
  if (modelsLoaded) return true;
  if (loadPromise) return loadPromise;

  // Use local models folder
  const MODEL_URL = '/models';
  
  loadPromise = Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
  ]).then(() => {
    modelsLoaded = true;
    return true;
  }).catch(err => {
    console.error("Failed to load face-api models", err);
    loadPromise = null;
    modelsLoaded = false;
    return false;
  });

  return loadPromise;
};

export const getFaceDescriptor = async (videoElement) => {
    const loaded = await loadFaceModels();
    if (!loaded) {
        console.error("Face models not loaded properly.");
        return null;
    }
    
    // Detect single face with landmarks and descriptor
    try {
        const detection = await faceapi.detectSingleFace(videoElement).withFaceLandmarks().withFaceDescriptor();
        if (!detection) return null;
        return Array.from(detection.descriptor); // Convert Float32Array to standard array
    } catch (err) {
        console.error("Error during face detection:", err);
        return null;
    }
};
