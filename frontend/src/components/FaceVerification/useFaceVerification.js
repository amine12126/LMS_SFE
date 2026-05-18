import { useState, useRef, useCallback, useEffect } from "react";
import API from "../../api/axios.js";
import { loadFaceModels, getFaceDescriptor } from "../../utils/faceApi.js";

export const STATES = {
  IDLE: "idle",
  CAM: "cam",
  SCANNING: "scanning",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  CAM_ERR: "cam_err",
};

const STATUS_TEXT = {
  [STATES.IDLE]:     { main: "Ready to scan",        sub: "Tap Scan Face to begin" },
  [STATES.CAM]:      { main: "Looking for your face…", sub: "Position your face in the circle" },
  [STATES.SCANNING]: { main: "Scanning…",            sub: "Hold still" },
  [STATES.LOADING]:  { main: "Verifying identity…",  sub: "Checking with secure server" },
  [STATES.SUCCESS]:  { main: "Access Granted",        sub: "Welcome back" },
  [STATES.ERROR]:    { main: "Face not recognized",   sub: "Verification failed" },
  [STATES.CAM_ERR]:  { main: "Camera unavailable",   sub: "Allow access in browser settings" },
};

async function callVerifyAPI(groupId, descriptor) {
  return API.post(
    `auth/access-group/${groupId}/`,
    { embedding: descriptor },
    { validateStatus: (s) => s < 500 }
  );
}

export function useFaceVerification({ groupId, onSuccess }) {
  const [phase, setPhase] = useState(STATES.IDLE);
  const [errorMsg, setErrorMsg] = useState("");
  const webcamRef = useRef(null);
  const streamRef = useRef(null);

  const statusText = STATUS_TEXT[phase];
  const isDisabled = phase === STATES.SCANNING || phase === STATES.LOADING;

  // Block background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Auto-redirect on success
  useEffect(() => {
    if (phase === STATES.SUCCESS) {
      const t = setTimeout(() => onSuccess(), 2000);
      return () => clearTimeout(t);
    }
  }, [phase, onSuccess]);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = s;
      if (webcamRef.current) webcamRef.current.srcObject = s;
      setPhase(STATES.CAM);
    } catch {
      setPhase(STATES.CAM_ERR);
      setErrorMsg("Camera permission denied. Please allow access in your browser settings.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const captureAndVerify = useCallback(async () => {
    if (!webcamRef.current) return;

    setPhase(STATES.SCANNING);
    
    // Ensure models are loaded
    await loadFaceModels();

    const video = webcamRef.current;
    
    // Extract face descriptor
    const descriptor = await getFaceDescriptor(video);

    if (!descriptor) {
        stopCamera();
        setErrorMsg("Aucun visage détecté ou visage flou. Rapprochez-vous de la caméra et réessayez.");
        setPhase(STATES.ERROR);
        return;
    }

    setPhase(STATES.LOADING);

    try {
      const res = await callVerifyAPI(groupId, descriptor);
      if (res.status === 200) {
        stopCamera();
        setPhase(STATES.SUCCESS);
      } else if (res.status === 403 || res.status === 400) {
        stopCamera();
        setErrorMsg(res.data?.error || "Face non reconnue ou non enregistrée.");
        setPhase(STATES.ERROR);
      } else {
        stopCamera();
        setErrorMsg(`Server error (${res.status}). Please try again.`);
        setPhase(STATES.ERROR);
      }
    } catch (err) {
      stopCamera();
      const msg = err.response?.data?.error || "Erreur réseau ou serveur inaccessible. Veuillez réessayer.";
      setErrorMsg(msg);
      setPhase(STATES.ERROR);
    }
  }, [groupId, stopCamera]);

  const retry = useCallback(() => {
    setErrorMsg("");
    setPhase(STATES.IDLE);
  }, []);

  const reset = useCallback(() => {
    stopCamera();
    setErrorMsg("");
    setPhase(STATES.IDLE);
  }, [stopCamera]);

  return {
    phase, statusText, errorMsg, isDisabled,
    webcamRef, startCamera, captureAndVerify, retry, reset,
  };
}
