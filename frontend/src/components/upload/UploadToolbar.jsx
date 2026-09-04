export default function UploadToolbar({
  fileInputRef,
  selectedFile,
  onFileChange,
  onSubmit,
  disabled,
  uploading,
  detecting,
}) {
  return (
    <div className="upload-toolbar">
      <label className="file-label">
        Choose Image
        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          onChange={onFileChange}
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
        onClick={onSubmit}
        disabled={!selectedFile || disabled}
        style={{ marginLeft: "auto" }}
      >
        {uploading ? "Preprocessing..." : detecting ? "AI Detecting..." : "Upload & Detect"}
      </button>
    </div>
  );
}