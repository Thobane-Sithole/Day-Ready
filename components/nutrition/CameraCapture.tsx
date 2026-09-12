"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

function compressImage(dataUrl: string, maxSize = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

export default function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const webcamRef = useRef<Webcam>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);

  const capture = useCallback(() => {
    const shot = webcamRef.current?.getScreenshot();
    if (shot) setPreview(shot);
  }, []);

  async function confirm() {
    if (!preview) return;
    const compressed = await compressImage(preview);
    onCapture(compressed);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content dr-card border-0">
            <div className="modal-header border-0 pb-0">
              <h2 className="h5 mb-0">Log a meal</h2>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="dr-camera-frame mb-3">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Captured meal preview" className="w-100 h-100" style={{ objectFit: "cover" }} />
                ) : cameraError ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-white text-center p-3">
                    Camera unavailable. Upload a photo instead.
                  </div>
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    onUserMediaError={() => setCameraError(true)}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                  />
                )}
              </div>

              <div className="d-flex align-items-center justify-content-center gap-3">
                {preview ? (
                  <>
                    <button className="btn btn-outline-secondary" onClick={() => setPreview(null)}>
                      Retake
                    </button>
                    <button className="btn btn-primary px-4" onClick={confirm}>
                      Use this photo
                    </button>
                  </>
                ) : (
                  <>
                    {!cameraError && (
                      <button
                        type="button"
                        className="dr-camera-shutter"
                        onClick={capture}
                        aria-label="Take photo"
                      />
                    )}
                    <label className="btn btn-outline-secondary btn-sm mb-0">
                      Upload photo
                      <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
