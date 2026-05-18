import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useFaceVerification, STATES } from "./useFaceVerification";

// ─── Keyframes (injected once) ─────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("fv-css")) {
  const s = document.createElement("style");
  s.id = "fv-css";
  s.textContent = `
    @keyframes fv-scan { 0%{top:8%;opacity:0} 15%{opacity:.85} 50%{top:50%} 85%{opacity:.85} 100%{top:92%;opacity:0} }
    @keyframes fv-pulse { 0%{opacity:.7;transform:scale(.9)} 100%{opacity:0;transform:scale(1.15)} }
    @keyframes fv-breath { 0%,100%{opacity:.35} 50%{opacity:.6} }
    @keyframes fv-shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-9px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-7px)} 60%{transform:translateX(5px)} 80%{transform:translateX(-3px)} }
    @keyframes fv-spin { to { transform: rotate(360deg); } }
    @keyframes fv-checkdraw { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
    @keyframes fv-fadein { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
    .fv-shake { animation: fv-shake .45s ease; }
  `;
  document.head.appendChild(s);
}

// ─── Colour tokens ─────────────────────────────────────────────────────────
const T = {
  bg: "#08080f",
  surface: "rgba(14,14,24,0.96)",
  border: "rgba(255,255,255,0.09)",
  text: "#f5f5f7",
  muted: "rgba(245,245,247,0.46)",
  blue: "#3b9eff",
  green: "#30d158",
  red: "#ff453a",
};

// ─── Ring colour per phase ─────────────────────────────────────────────────
const ringColor = (phase) => ({
  [STATES.IDLE]:     "rgba(255,255,255,0.16)",
  [STATES.CAM]:      T.blue,
  [STATES.SCANNING]: T.blue,
  [STATES.LOADING]:  T.blue,
  [STATES.SUCCESS]:  T.green,
  [STATES.ERROR]:    T.red,
  [STATES.CAM_ERR]:  T.red,
}[phase] ?? "rgba(255,255,255,0.16)");

// ─── Sub-components ────────────────────────────────────────────────────────

const CornerBracket = ({ phase, flip }) => (
  <svg
    viewBox="0 0 26 26" width={26} height={26}
    style={{ position:"absolute", ...flip, lineHeight:0 }}
  >
    <path
      d="M22 4H9C6.2 4 4 6.2 4 9v13"
      fill="none" stroke={ringColor(phase)}
      strokeWidth={2.5} strokeLinecap="round"
      style={{ transition:"stroke .45s" }}
    />
  </svg>
);

const FaceOutline = ({ phase }) => (
  <svg viewBox="0 0 80 80" fill="none" width={80} height={80}
    style={{
      opacity: phase === STATES.SUCCESS ? 0 : phase === STATES.CAM ? 0 : .2,
      animation: [STATES.CAM, STATES.SCANNING].includes(phase) ? "fv-breath 2s ease-in-out infinite" : "none",
      transition: "opacity .4s",
    }}>
    <ellipse cx="40" cy="36" rx="18" ry="20" stroke="white" strokeWidth={2}/>
    <path d="M17 62c0-12.7 10.3-23 23-23 12.7 0 23 10.3 23 23" stroke="white" strokeWidth={2} strokeLinecap="round"/>
    <circle cx="32" cy="34" r="2.5" fill="white"/>
    <circle cx="48" cy="34" r="2.5" fill="white"/>
    <path d="M33 42q7 4 14 0" stroke="white" strokeWidth={1.5} strokeLinecap="round"/>
  </svg>
);

const CheckMark = ({ show }) => (
  <svg viewBox="0 0 52 52" fill="none" width={52} height={52}
    style={{
      position:"absolute", opacity: show ? 1 : 0,
      transform: show ? "scale(1)" : "scale(.55)",
      transition: "opacity .35s, transform .35s",
    }}>
    <circle cx="26" cy="26" r="24" stroke={T.green} strokeWidth={2}/>
    <path d="M15 27l8 8 14-16" stroke={T.green} strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={60} strokeDashoffset={show ? 0 : 60}
      style={{ transition:"stroke-dashoffset .5s .1s ease" }}
    />
  </svg>
);

const Spinner = () => (
  <svg viewBox="0 0 24 24" fill="none" width={22} height={22}
    style={{ animation:"fv-spin .8s linear infinite", flexShrink:0 }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2.5} strokeOpacity={.25}/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"/>
  </svg>
);

const DotsLoader = () => {
  const dotStyle = (delay) => ({
    width:5, height:5, borderRadius:"50%",
    background:T.blue, animation:`fv-breath .8s ease-in-out ${delay}s infinite`,
  });
  return (
    <div style={{ display:"flex", gap:6 }}>
      <div style={dotStyle(0)}/><div style={dotStyle(.2)}/><div style={dotStyle(.4)}/>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────

const FaceVerificationModal = ({ groupId, onSuccess, onClose }) => {
  const {
    phase, statusText, errorMsg, isDisabled,
    webcamRef, startCamera, captureAndVerify, retry, reset,
  } = useFaceVerification({ groupId, onSuccess });

  const modalRef = useRef(null);

  // Shake on error
  useEffect(() => {
    if (phase === STATES.ERROR && modalRef.current) {
      modalRef.current.classList.add("fv-shake");
      const t = setTimeout(() => modalRef.current?.classList.remove("fv-shake"), 500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleRetry = () => { reset(); startCamera(); };
  const handleClose = () => { reset(); onClose(); };

  const handleMain = () => {
    if (phase === STATES.IDLE || phase === STATES.CAM_ERR) return startCamera();
    if (phase === STATES.CAM) return captureAndVerify();
    if (phase === STATES.ERROR) return handleRetry();
    if (phase === STATES.SUCCESS) return onSuccess();
  };

  const rc = ringColor(phase);
  const showScanLine = [STATES.SCANNING, STATES.LOADING].includes(phase);
  const showPulse = [STATES.CAM, STATES.SCANNING, STATES.LOADING].includes(phase);
  const showCam = [STATES.CAM, STATES.SCANNING, STATES.LOADING].includes(phase);

  const mainBtnLabel = {
    [STATES.IDLE]:     "Scan Face",
    [STATES.CAM]:      "Capture",
    [STATES.SCANNING]: "Scanning…",
    [STATES.LOADING]:  "Verifying…",
    [STATES.SUCCESS]:  "Continue →",
    [STATES.ERROR]:    "Try Again",
    [STATES.CAM_ERR]:  "Retry Camera",
  }[phase];

  const mainBtnColor = {
    [STATES.SUCCESS]: T.green,
    [STATES.ERROR]:   T.red,
    [STATES.CAM_ERR]: T.red,
  }[phase] ?? T.blue;

  return ReactDOM.createPortal(
    <div style={{
      position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:999999,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"1rem", background:"rgba(0,0,0,0.85)",
      backdropFilter:"blur(10px) saturate(0.6)",
      animation:"fv-fadein .25s ease",
    }}>
      {/* Backdrop */}
      <div style={{ position:"absolute", inset:0, cursor:"pointer" }}
        onClick={isDisabled ? undefined : handleClose} />

      {/* Modal card */}
      <div ref={modalRef} style={{
        position:"relative", zIndex:1,
        background: T.surface,
        border: `0.5px solid ${T.border}`,
        borderRadius:28, padding:"36px 28px 28px",
        width:"100%", maxWidth:360,
        display:"flex", flexDirection:"column", alignItems:"center",
        boxShadow:"0 32px 80px rgba(0,0,0,.7), 0 0 0 0.5px rgba(255,255,255,.04)",
        fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",
        color: T.text,
        marginTop: "0",
      }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:26 }}>
          <h2 style={{ fontSize:20, fontWeight:600, letterSpacing:"-.4px", color:T.text, margin:0 }}>
            Face ID
          </h2>
          <p style={{ fontSize:13, color:T.muted, marginTop:5, fontWeight:400 }}>
            Verify your identity to continue
          </p>
        </div>

        {/* Live indicator */}
        {showCam && (
          <div style={{ fontSize:11, color:`${T.blue}99`, letterSpacing:".4px",
            textTransform:"uppercase", fontWeight:500, marginBottom:6 }}>
            ● Live
          </div>
        )}

        {/* Face frame */}
        <div style={{ position:"relative", width:200, height:200, marginBottom:26 }}>
          {/* Outer glow ring */}
          <div style={{
            position:"absolute", inset:-8, borderRadius:"50%",
            border:`0.5px solid rgba(255,255,255,.05)`,
          }}/>

          {/* Pulse rings */}
          {showPulse && <>
            <div style={{
              position:"absolute", inset:-14, borderRadius:"50%",
              border:`1px solid ${T.blue}55`,
              animation:"fv-pulse 2s ease-out infinite",
            }}/>
            <div style={{
              position:"absolute", inset:-26, borderRadius:"50%",
              border:`1px solid ${T.blue}22`,
              animation:"fv-pulse 2s ease-out .7s infinite",
            }}/>
          </>}

          {/* Main ring + corner brackets */}
          <div style={{
            position:"absolute", inset:0, borderRadius:"50%",
            border:`2px solid ${rc}`,
            transition:"border-color .45s",
          }}>
            <CornerBracket phase={phase} flip={{ top:-1, left:-1 }}/>
            <CornerBracket phase={phase} flip={{ top:-1, right:-1, transform:"scaleX(-1)" }}/>
            <CornerBracket phase={phase} flip={{ bottom:-1, left:-1, transform:"scaleY(-1)" }}/>
            <CornerBracket phase={phase} flip={{ bottom:-1, right:-1, transform:"scale(-1)" }}/>
          </div>

          {/* Scan line */}
          {showScanLine && (
            <div style={{
              position:"absolute", left:4, right:4, height:1.5,
              background:`linear-gradient(90deg,transparent,${T.blue},transparent)`,
              borderRadius:1, animation:"fv-scan 2s ease-in-out infinite",
              pointerEvents:"none", zIndex:2,
            }}/>
          )}

          {/* Inner circle */}
          <div style={{
            position:"absolute", inset:6, borderRadius:"50%",
            background:"rgba(255,255,255,.03)",
            overflow:"hidden",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <FaceOutline phase={phase}/>
            <CheckMark show={phase === STATES.SUCCESS}/>
            <video
              ref={webcamRef} autoPlay muted playsInline
              style={{
                position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", borderRadius:"50%",
                opacity: showCam ? 1 : 0, transition:"opacity .5s",
              }}
            />
          </div>
        </div>

        {/* Progress bar */}
        {[STATES.SCANNING, STATES.LOADING, STATES.SUCCESS].includes(phase) && (
          <div style={{
            width:"100%", height:2, background:"rgba(255,255,255,.08)",
            borderRadius:1, overflow:"hidden", marginBottom:18,
          }}>
            <div style={{
              height:"100%", borderRadius:1,
              background:`linear-gradient(90deg,${T.blue},${T.blue}55)`,
              width: phase === STATES.SUCCESS ? "100%" : phase === STATES.LOADING ? "85%" : "50%",
              transition:"width .6s ease",
            }}/>
          </div>
        )}

        {/* Status text */}
        <div style={{ textAlign:"center", marginBottom:20, minHeight:44,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
          <div style={{ fontSize:15, fontWeight:500, letterSpacing:"-.2px", color:T.text }}>
            {statusText.main}
          </div>
          {isDisabled
            ? <DotsLoader/>
            : <div style={{ fontSize:12, color:T.muted }}>{statusText.sub}</div>
          }
        </div>

        {/* Error banner */}
        {(phase === STATES.ERROR || phase === STATES.CAM_ERR) && (
          <div style={{
            width:"100%", background:"rgba(255,69,58,.09)",
            border:"0.5px solid rgba(255,69,58,.25)",
            borderRadius:12, padding:"10px 14px",
            display:"flex", gap:8, marginBottom:14,
          }}>
            <span style={{ color:T.red, flexShrink:0, fontSize:13 }}>✕</span>
            <span style={{ fontSize:12, color:"#ff9390", lineHeight:1.5 }}>{errorMsg}</span>
          </div>
        )}

        {/* Success banner */}
        {phase === STATES.SUCCESS && (
          <div style={{
            width:"100%", background:"rgba(48,209,88,.09)",
            border:"0.5px solid rgba(48,209,88,.25)",
            borderRadius:12, padding:"10px 14px",
            display:"flex", gap:8, marginBottom:14,
          }}>
            <span style={{ color:T.green, fontSize:13 }}>✓</span>
            <span style={{ fontSize:12, color:"#5de68a", lineHeight:1.5 }}>
              Identity confirmed — redirecting to your group…
            </span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display:"flex", gap:10, width:"100%" }}>
          {phase !== STATES.SUCCESS && (
            <button onClick={handleClose} disabled={isDisabled} style={{
              flex:1, padding:"13px 0", borderRadius:14,
              fontSize:14, fontWeight:500, cursor: isDisabled ? "not-allowed" : "pointer",
              background:"rgba(255,255,255,.07)", color:T.text,
              border:"0.5px solid rgba(255,255,255,.12)",
              opacity: isDisabled ? .4 : 1, transition:"opacity .2s,background .2s",
              fontFamily:"inherit",
            }}>
              Cancel
            </button>
          )}

          {phase === STATES.ERROR && (
            <button onClick={handleRetry} style={{
              flex:1, padding:"13px 0", borderRadius:14,
              fontSize:14, fontWeight:500, cursor:"pointer",
              background:"rgba(255,255,255,.07)", color:T.text,
              border:"0.5px solid rgba(255,255,255,.12)",
              fontFamily:"inherit",
            }}>
              ↩ Retry
            </button>
          )}

          <button onClick={handleMain} disabled={isDisabled} style={{
            flex:1, padding:"13px 0", borderRadius:14,
            fontSize:14, fontWeight:600, cursor: isDisabled ? "not-allowed" : "pointer",
            background: mainBtnColor, color:"#fff",
            border:"none", opacity: isDisabled ? .5 : 1,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            transition:"opacity .2s,filter .2s", fontFamily:"inherit",
          }}>
            {isDisabled && <Spinner/>}
            {mainBtnLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FaceVerificationModal;
