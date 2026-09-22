import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type CameraState = 'starting' | 'live' | 'denied' | 'unavailable';

export interface CameraHandle {
  /** Grabs exactly what is visible inside the frame, as a JPEG data URL. */
  capture: () => string | null;
  toggleTorch: () => void;
}

interface Props {
  onState: (s: CameraState, info: { torch: boolean }) => void;
}

/**
 * Live rear-camera preview. Needs a secure context (https or localhost); when
 * the camera is missing or blocked the parent falls back to the native picker.
 */
export const Camera = forwardRef<CameraHandle, Props>(function Camera({ onState }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const report = useRef(onState);
  report.current = onState;

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      report.current('unavailable', { torch: false });
      return;
    }
    report.current('starting', { torch: false });
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = s;
        const v = video.current!;
        v.srcObject = s;
        await v.play().catch(() => {});
        const track = s.getVideoTracks()[0];
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        report.current('live', { torch: !!caps.torch });
      })
      .catch((e: DOMException) => {
        if (cancelled) return;
        report.current(e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'denied' : 'unavailable', { torch: false });
      });
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    capture: () => {
      const v = video.current;
      const b = box.current;
      if (!v || !b || !v.videoWidth) return null;
      // The preview is object-fit: cover — crop the source to what is on screen.
      const { width: w, height: h } = b.getBoundingClientRect();
      const scale = Math.max(w / v.videoWidth, h / v.videoHeight);
      const sw = w / scale;
      const sh = h / scale;
      const sx = (v.videoWidth - sw) / 2;
      const sy = (v.videoHeight - sh) / 2;
      const c = document.createElement('canvas');
      c.width = Math.round(sw);
      c.height = Math.round(sh);
      c.getContext('2d')!.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.92);
    },
    toggleTorch: () => {
      const track = stream.current?.getVideoTracks()[0];
      if (!track) return;
      const next = !torchOn;
      track
        .applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
        .then(() => setTorchOn(next))
        .catch(() => {});
    },
  }));

  return (
    <div ref={box} style={{ position: 'absolute', inset: 0 }}>
      <video ref={video} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  );
});
