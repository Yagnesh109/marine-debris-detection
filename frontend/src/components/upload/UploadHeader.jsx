export default function UploadHeader({ onReset, disabled }) {
  return (
    <div className="upload-header">
      <div>
        <h2 className="upload-title">Sonar Image Analysis</h2>
        <p className="upload-subtitle">
          Upload a .bmp side-scan sonar image. It is preprocessed and then
          automatically analyzed by the YOLO model.
        </p>
      </div>
      <button
        type="button"
        className="action-button upload-other-button"
        onClick={onReset}
        disabled={disabled}
      >
        Upload other image
      </button>
    </div>
  );
}