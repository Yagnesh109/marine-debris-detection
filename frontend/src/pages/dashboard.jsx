import React, { useEffect, useState } from "react";
import "./dashboard.css";

/**
 * Dashboard.jsx
 *
 * Landing page giving an at-a-glance view of the system:
 *   - Live counters   (fetched every 10s from GET /api/stats)
 *   - Quick actions   (jump to Upload / Map pages)
 *   - Pipeline steps  (how the detection flow works)
 *   - Recent activity (latest objects found by the AI)
 */

const PIPELINE_STEPS = [
  { title: "Upload", description: "Select a side-scan sonar image (.bmp)" },
  { title: "Preprocess", description: "Image is cleaned and prepared for the model" },
  { title: "AI Detection", description: "YOLO locates debris and draws bounding boxes" },
  { title: "Geotagging", description: "Latitude / longitude joined from geotag.csv" },
  { title: "Report", description: "Download a structured JSON report" },
];

export default function Dashboard({ aiApiBaseUrl, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const res = await fetch(`${aiApiBaseUrl}/api/stats`);
        if (!res.ok) throw new Error("stats unavailable");
        const data = await res.json();
        if (isMounted) {
          setStats(data);
          setBackendError(false);
        }
      } catch {
        if (isMounted) setBackendError(true);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [aiApiBaseUrl]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-inner">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="dashboard-hero">
          <h1>Debris Detector</h1>
          <p>
            AI-powered analysis of side-scan sonar images for underwater debris
            detection, geolocation and reporting.
          </p>
        </header>

        {/* ── Stat cards ───────────────────────────────────────────────── */}
        <section className="stats-grid">
          <StatCard label="Images Analyzed" value={stats?.images_processed} />
          <StatCard label="Objects Detected" value={stats?.objects_detected} accent />
          <StatCard label="Geotagged Entries" value={stats?.dataset_entries} />
          <StatCard label="Detectable Classes" value={stats?.model_classes} />
        </section>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <section className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <button
              type="button"
              className="action-button primary"
              onClick={() => onNavigate("upload")}
            >
              Analyze New Image
            </button>
            <button
              type="button"
              className="action-button"
              onClick={() => onNavigate("maps")}
            >
              Open Detection Map
            </button>
          </div>
        </section>

        {/* ── Pipeline ─────────────────────────────────────────────────── */}
        <section className="dashboard-section">
          <h2 className="section-title">Detection Pipeline</h2>
          <ol className="pipeline-grid">
            {PIPELINE_STEPS.map((step, index) => (
              <li key={step.title} className="pipeline-step">
                <span className="pipeline-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Recent detections ────────────────────────────────────────── */}
        <section className="dashboard-section">
          <h2 className="section-title">Recent Detections</h2>

          {backendError && (
            <p className="dashboard-warning">
              Cannot reach the AI backend at {aiApiBaseUrl}. Start it with{" "}
              <code>uvicorn main:app --port 8000</code>.
            </p>
          )}

          {!backendError && !stats?.recent_detections?.length && (
            <p className="dashboard-empty">
              No detections yet. Upload a sonar image to get started.
            </p>
          )}

          {!!stats?.recent_detections?.length && (
            <div className="table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Object</th>
                    <th>Confidence</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_detections.map((detection, index) => (
                    <tr key={`${detection.image_id}-${index}`}>
                      <td className="mono">{detection.filename}</td>
                      <td>{detection.name}</td>
                      <td>{(detection.confidence * 100).toFixed(1)}%</td>
                      <td className="mono">{detection.latitude ?? "-"}</td>
                      <td className="mono">{detection.longitude ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Small building block ─────────────────────────────────────────────── */
function StatCard({ label, value, accent = false }) {
  return (
    <div className={`stat-card${accent ? " accent" : ""}`}>
      <span className="stat-value">{value ?? "-"}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
