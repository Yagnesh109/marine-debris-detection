import "./navbar.css";

const Navbar = ({
  activeTab,
  onNavigate,
  hasDetections,
  onGenerateReport,
}) => {
  return (
    <nav className="main-navbar" aria-label="Main navigation">
      <button
        type="button"
        onClick={() => onNavigate("dashboard")}
        aria-current={activeTab === "dashboard" ? "page" : undefined}
        className={`navbar-tab${activeTab === "dashboard" ? " active" : ""}`}
      >
        Dashboard
      </button>

      <button
        type="button"
        onClick={() => onNavigate("history")}
        aria-current={activeTab === "history" ? "page" : undefined}
        className={`navbar-tab${activeTab === "history" ? " active" : ""}`}
      >
        History
      </button>

      <>
        <span className="navbar-tab-tooltip" data-tooltip="Please upload and analyze data">
          <button
            type="button"
            onClick={() => onNavigate("maps")}
            aria-current={activeTab === "maps" ? "page" : undefined}
            className={`navbar-tab${activeTab === "maps" ? " active" : ""}`}
            disabled={!hasDetections}
          >
            Show Object on Map
          </button>
        </span>

        <span className="navbar-tab-tooltip" data-tooltip="Please upload and analyze data">
          <button
            type="button"
            onClick={() => onNavigate("3d-map")}
            aria-current={activeTab === "3d-map" ? "page" : undefined}
            className={`navbar-tab${activeTab === "3d-map" ? " active" : ""}`}
            disabled={!hasDetections}
          >
            Show in 3D Map
          </button>
        </span>

        <span className="navbar-tab-tooltip" data-tooltip="Please upload and analyze data">
          <button
            type="button"
            onClick={() => onNavigate("annotated-image")}
            aria-current={activeTab === "annotated-image" ? "page" : undefined}
            className={`navbar-tab${activeTab === "annotated-image" ? " active" : ""}`}
            disabled={!hasDetections}
          >
            Show Object on Image
          </button>
        </span>

        <span className="navbar-tab-tooltip navbar-report-tooltip" data-tooltip="Please upload and analyze data">
          <button
            type="button"
            className={`navbar-tab${activeTab === "report" ? " active" : ""}`}
            style={{ marginLeft: "auto" }}
            onClick={onGenerateReport}
            disabled={!hasDetections}
          >
            Generate Report
          </button>
        </span>
      </>
    </nav>
  );
};

export default Navbar;
