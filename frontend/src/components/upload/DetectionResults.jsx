export default function DetectionResults({ detectionResult }) {
  if (!detectionResult) return null;

  const detections = detectionResult.objects_detected || [];
  return (
    <section className="results-section">
      <h3 className="results-heading">Detection Results</h3>
      <p className="results-summary">{detectionResult.message}</p>

      {detections.length > 0 && (
        <div className="table-scroll">
          <table className="detection-table">
            <thead>
              <tr>
                <th>Object</th>
                <th>Confidence</th>
                <th>Range</th>
                <th>Depth</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Bounding Box (xmin, ymin - xmax, ymax)</th>
              </tr>
            </thead>
            <tbody>
              {detections.map((object, index) => (
                <tr key={`${object.name}-${index}`}>
                  <td>{object.name}</td>
                  <td><span className="confidence-pill">{object.confidence == null ? "XML annotation" : `${(object.confidence * 100).toFixed(1)}%`}</span></td>
                  <td className="mono">{object.sonar_range.toFixed(2)} m</td>
                  <td className="mono">{object.depth.toFixed(2)} m</td>
                  <td className="mono">{object.latitude == null ? "-" : object.latitude}</td>
                  <td className="mono">{object.longitude == null ? "-" : object.longitude}</td>
                  <td className="mono">
                    ({object.bndbox.xmin}, {object.bndbox.ymin}) - ({object.bndbox.xmax},{" "}
                    {object.bndbox.ymax})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}