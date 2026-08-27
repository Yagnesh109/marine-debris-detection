import "./navbar.css";

const Navbar = ({ activeTab, onNavigate, onCalculatePositions, calculating }) => {
  const tabs = ["Dashboard", "Maps", "Upload"];

  return (
    <nav className="main-navbar" aria-label="Main navigation">
      {tabs.map((tab) => {
        const tabKey = tab.toLowerCase();
        const isActive = activeTab === tabKey;

        return (
          <button
            key={tabKey}
            type="button"
            onClick={() => onNavigate(tabKey)}
            aria-current={isActive ? "page" : undefined}
            className={`navbar-tab${isActive ? " active" : ""}`}
          >
            {tab}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onCalculatePositions}
        disabled={calculating}
        className="navbar-action"
      >
        {calculating ? "Calculating..." : "Calculate Position"}
      </button>
    </nav>
  );
};

export default Navbar;
