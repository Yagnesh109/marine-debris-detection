import React, { useState } from 'react';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.bmp')) {
        alert("Please select a .bmp format image.");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <div style={{ padding: '24px', color: '#e6edf3', height: '100%', background: '#0d1117', overflowY: 'auto' }}>
      <h2>Upload Image (.bmp)</h2>
      <div style={{ marginTop: '16px' }}>
        <input 
          type="file" 
          accept=".bmp" 
          onChange={handleFileChange}
          style={{ marginBottom: '16px' }}
        />
      </div>
      {previewUrl && (
        <div>
          <h3>Preview:</h3>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #30363d', borderRadius: '8px' }} />
        </div>
      )}
    </div>
  );
}
