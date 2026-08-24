import "./navbar.css";

const Navbar = ({ activeTab, onNavigate }) => {
  const tabs = ["Dashboard", "Maps"];

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
    </nav>
  );
};

export default Navbar;
