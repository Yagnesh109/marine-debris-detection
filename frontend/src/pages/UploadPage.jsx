import React, { useState } from "react";
import "./UploadPage.css";

/**
 * UploadPage.jsx
 *
 * Full debris-detection workflow:
 *   1. User selects a sonar image (.bmp).
 *   2. The image is sent to  POST /api/preprocess            (API 1).
 *   3. On success the same image is AUTOMATICALLY forwarded to
 *      POST /api/detect/{image_id}                           (API 2 - YOLO + geotag).
 *   4. Once detections are back, three actions become available:
 *        - Show Object on Map    -> plots lat/lon on the Maps page
 *        - Show Object on Image  -> displays the YOLO annotated image
 *        - Generate Report       -> downloads the JSON report       (API 3)
 */

export default function UploadPage({ aiApiBaseUrl, onDetectionComplete, onNavigate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [preprocessInfo, setPreprocessInfo] = useState(null); // { message, imageUrl }
  const [detectionResult, setDetectionResult] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");

  const [showAnnotatedImage, setShowAnnotatedImage] = useState(false);

  /* -- Step 0: file selection ------------------------------------------------ */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPreprocessInfo(null);
    setDetectionResult(null);
    setError("");
    setShowAnnotatedImage(false);

    if (!file) return;
    /*
    if (!file.name.toLowerCase().endsWith(".bmp")) {
      alert("Please select a .bmp format image.");
      e.target.value = "";
      return;
    }
    */
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* -- API 1: preprocessing -------------------------------------------------- */
  const preprocessImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${aiApiBaseUrl}/api/preprocess`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || "Preprocessing failed");

    setPreprocessInfo({
      message: data.message,
      imageUrl: `${aiApiBaseUrl}${data.preprocessed_image_url}`,
    });

    return data.image_id;
  };

  /* -- API 2: YOLO detection (called automatically after step 1) -------------- */
  const detectObjects = async (imageId) => {
    const res = await fetch(`${aiApiBaseUrl}/api/detect/${imageId}`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || "AI detection failed");

    setDetectionResult(data);
    if (onDetectionComplete) onDetectionComplete(data);
  };

  /* -- Full pipeline: preprocess -> detect ------------------------------------ */
  const handleUploadAndDetect = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setDetectionResult(null);
    setShowAnnotatedImage(false);

    try {
      const imageId = await preprocessImage(selectedFile);

      setUploading(false);
      setDetecting(true);
      await detectObjects(imageId);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setDetecting(false);
    }
  };

  /* -- API 3: download the JSON report ---------------------------------------- */
  const handleGenerateReport = () => {
    const link = document.createElement("a");
    link.href = `${aiApiBaseUrl}/api/report/${detectionResult.image_id}/download`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const mediaUrl = (relativeUrl) => `${aiApiBaseUrl}${relativeUrl}`;
  const isBusy = uploading || detecting;
  const hasDetections = detectionResult?.objects_detected?.length > 0;

  return (
    <div className="upload-page">
      <div className="upload-inner">
        {/* -- Header --------------------------------------------------------- */}
        <h2 className="upload-title">Sonar Image Analysis</h2>
        <p className="upload-subtitle">
          Upload a .bmp side-scan sonar image. It is preprocessed and then
          automatically analyzed by the YOLO model.
        </p>

        {/* -- Toolbar: choose file + start pipeline --------------------------- */}
        <div className="upload-toolbar">
          <label className="file-label">
            Choose Image
            <input
              className="file-input"
              type="file"
              onChange={handleFileChange}
            />
          </label>

          {selectedFile && (
            <span className="file-name" title={selectedFile.name}>
              {selectedFile.name}
            </span>
          )}

          <button
            type="button"
            className="action-button primary"
            onClick={handleUploadAndDetect}
            disabled={!selectedFile || isBusy}
            style={{ marginLeft: "auto" }}
          >
            {uploading ? "Preprocessing..." : detecting ? "AI Detecting..." : "Upload & Detect"}
          </button>
        </div>

        {/* -- Status banners --------------------------------------------------- */}
        {uploading && (
          <div className="status-banner info">Step 1/2 - Preprocessing image...</div>
        )}
        {detecting && (
          <div className="status-banner info">Step 2/2 - Running YOLO detection...</div>
        )}
        {error && <div className="status-banner error">Error: {error}</div>}
        {preprocessInfo && !isBusy && (
          <div className="status-banner success">{preprocessInfo.message}</div>
        )}

        {/* -- Original + preprocessed previews --------------------------------- */}
        {(previewUrl || preprocessInfo) && (
          <div className="preview-grid">
            {previewUrl && (
              <div className="preview-card">
                <h3>Original</h3>
                <img className="preview-image" src={previewUrl} alt="Original" />
              </div>
            )}
            {preprocessInfo && (
              <div className="preview-card">
                <h3>Preprocessed</h3>
                <p className="preview-caption">{preprocessInfo.message}</p>
                <img
                  className="preview-image"
                  src={preprocessInfo.imageUrl}
                  alt="Preprocessed"
                />
              </div>
            )}
          </div>
        )}

        {/* -- Detection results ------------------------------------------------- */}
        {detectionResult && (
          <section className="results-section">
            <h3 className="results-heading">Detection Results</h3>
            <p className="results-summary">{detectionResult.message}</p>

            {hasDetections && (
              <>
                <div className="table-scroll">
                  <table className="detection-table">
                    <thead>
                      <tr>
                        <th>Object</th>
                        <th>Confidence</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Bounding Box (xmin, ymin - xmax, ymax)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detectionResult.objects_detected.map((obj, index) => (
                        <tr key={index}>
                          <td>{obj.name}</td>
                          <td>
                            <span className="confidence-pill">
                              {(obj.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="mono">{obj.latitude == null ? "-" : obj.latitude}</td>
                          <td className="mono">{obj.longitude == null ? "-" : obj.longitude}</td>
                          <td className="mono">
                            ({obj.bndbox.xmin}, {obj.bndbox.ymin}) - ({obj.bndbox.xmax},{" "}
                            {obj.bndbox.ymax})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* -- Action buttons ---------------------------------------------- */}
                <div className="result-actions">
                  <button
                    type="button"
                    className="action-button primary"
                    onClick={() => onNavigate("maps")}
                  >
                    Show Object on Map
                  </button>
                  <button
                    type="button"
                    className="action-button primary"
                    onClick={() => onNavigate("3d-map")}
                  >
                    Show in 3D Map
                  </button>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => setShowAnnotatedImage((visible) => !visible)}
                  >
                    {showAnnotatedImage ? "Hide Object on Image" : "Show Object on Image"}
                  </button>
                  <button type="button" className="action-button" onClick={handleGenerateReport}>
                    Generate Report
                  </button>
                </div>

                {/* -- YOLO annotated image ---------------------------------------- */}
                {showAnnotatedImage && (
                  <div className="annotated-block">
                    <img
                      className="annotated-image"
                      src={mediaUrl(detectionResult.annotated_image_url)}
                      alt="YOLO detections"
                    />
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
