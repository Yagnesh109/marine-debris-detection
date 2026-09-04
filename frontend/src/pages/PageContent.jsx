import Dashboard from "./dashboard";
import MapPage from "./MapPage";
import ThreeDMapPage from "./ThreeDMapPage";
import AnnotatedImagePage from "./AnnotatedImagePage";
import HistoryPage from "./HistoryPage";

export default function PageContent({
  activeTab,
  aiApiBaseUrl,
  apiBaseUrl,
  detections,
  detectionResult,
  onDetectionComplete,
  onNavigate,
}) {
  return (
    <>
      <div
        style={{
          display: activeTab === "dashboard" ? "block" : "none",
          height: "100%",
        }}
      >
        <Dashboard
          aiApiBaseUrl={aiApiBaseUrl}
          onDetectionComplete={onDetectionComplete}
          onNavigate={onNavigate}
        />
      </div>

      {activeTab === "maps" && (
        <MapPage apiBaseUrl={apiBaseUrl} refreshKey={0} detectionPoints={detections} />
      )}
      {activeTab === "3d-map" && (
        <ThreeDMapPage detections={detections} onNavigate={onNavigate} />
      )}
      {activeTab === "annotated-image" && (
        <AnnotatedImagePage
          apiBaseUrl={aiApiBaseUrl}
          imageUrl={detectionResult?.annotated_image_url}
        />
      )}
      {activeTab === "history" && <HistoryPage />}
    </>
  );
}