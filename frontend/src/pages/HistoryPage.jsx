import "./HistoryPage.css";

const historyItems = [
  ["plane", "84.9%", "18.98017195", "72.78020487", "2026-09-04", "18:42:16", "(239, 1395) - (331, 1475)"],
  ["ship wreck", "91.6%", "18.922000", "72.83484242", "2026-09-04", "18:37:09", "(121, 108) - (396, 359)"],
  ["ghost net", "76.3%", "19.076090", "72.877426", "2026-09-03", "16:21:44", "(485, 224) - (702, 410)"],
  ["human body", "88.1%", "15.490930", "73.827850", "2026-09-02", "14:08:31", "(88, 316) - (241, 548)"],
  ["plane", "79.8%", "19.017800", "73.014200", "2026-09-01", "11:52:03", "(305, 186) - (522, 401)"],
  ["ship", "93.2%", "18.520430", "73.856744", "2026-08-31", "09:44:27", "(142, 92) - (410, 338)"],
  ["net", "81.7%", "16.705000", "74.243300", "2026-08-30", "17:15:52", "(268, 512) - (478, 690)"],
  ["wreck", "87.5%", "17.686816", "74.006000", "2026-08-29", "13:29:18", "(52, 204) - (286, 455)"],
  ["plane wreck", "74.6%", "19.218330", "72.978090", "2026-08-28", "12:06:40", "(604, 128) - (842, 337)"],
  ["human body", "89.4%", "15.299326", "74.124000", "2026-08-27", "10:33:25", "(190, 402) - (354, 628)"],
  ["ghost net", "78.2%", "18.989400", "73.117500", "2026-08-26", "15:48:11", "(418, 275) - (633, 489)"],
  ["ship", "95.1%", "18.408800", "76.560400", "2026-08-25", "08:19:56", "(108, 154) - (390, 386)"],
];

export default function HistoryPage() {
  return (
    <main className="history-page">
      <div className="history-inner">
        <header className="history-header">
          <h1>Detection History</h1>
          <p>Recent debris detections and their analysis details.</p>
        </header>

        <div className="history-filter-row">
          <label htmlFor="history-date">Date</label>
          <input id="history-date" className="history-filter" type="date" defaultValue="2026-09-04" />
        </div>

        <div className="history-table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Object</th>
                <th>Confidence</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Date</th>
                <th>Timestamp</th>
                <th>Bounding Box (xmin, ymin - xmax, ymax)</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item, index) => (
                <tr key={`${item[0]}-${index}`}>
                  <td>{item[0]}</td>
                  <td><span className="history-confidence">{item[1]}</span></td>
                  <td className="history-mono">{item[2]}</td>
                  <td className="history-mono">{item[3]}</td>
                  <td className="history-mono">{item[4]}</td>
                  <td className="history-mono">{item[5]}</td>
                  <td className="history-mono">{item[6]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}