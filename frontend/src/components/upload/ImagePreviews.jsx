export default function ImagePreviews({ previewUrl, preprocessInfo }) {
  if (!previewUrl && !preprocessInfo) return null;

  return (
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
          <img className="preview-image" src={preprocessInfo.imageUrl} alt="Preprocessed" />
        </div>
      )}
    </div>
  );
}