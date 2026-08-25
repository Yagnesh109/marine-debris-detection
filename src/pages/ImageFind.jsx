import React, { useCallback, useEffect, useState } from "react";

async function fetchFromWikimedia(query) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url|size",
    iiurlwidth: "600",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  const data = await res.json();
  const page = data.query?.pages ? Object.values(data.query.pages)[0] : null;
  const imageInfo = page?.imageinfo?.[0];

  if (!imageInfo?.thumburl && !imageInfo?.url) {
    throw new Error(`No Wikimedia results for "${query}"`);
  }

  return {
    url: imageInfo.thumburl || imageInfo.url,
    width: imageInfo.thumbwidth || imageInfo.width,
    height: imageInfo.thumbheight || imageInfo.height,
    source: "Wikimedia Commons",
  };
}

async function fetchFromPixabay(query, apiKey) {
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&image_type=photo&per_page=3&safesearch=true`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.hits || data.hits.length === 0) {
    throw new Error(`No Pixabay results for "${query}"`);
  }

  const hit = data.hits[0];
  return {
    url: hit.largeImageURL || hit.webformatURL,
    width: hit.imageWidth,
    height: hit.imageHeight,
    source: "Pixabay",
  };
}

async function fetchFromUnsplash(query, apiKey) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=1&orientation=squarish`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${apiKey}` },
  });
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`No Unsplash results for "${query}"`);
  }

  const img = data.results[0];
  return {
    url: img.urls.regular,
    width: img.width,
    height: img.height,
    source: "Unsplash",
  };
}

async function fetchFromPexels(query, apiKey) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&per_page=1`;
  const res = await fetch(url, {
    headers: { Authorization: apiKey },
  });
  const data = await res.json();

  if (!data.photos || data.photos.length === 0) {
    throw new Error(`No Pexels results for "${query}"`);
  }

  const photo = data.photos[0];
  return {
    url: photo.src.large,
    width: photo.width,
    height: photo.height,
    source: "Pexels",
  };
}

function extractLabels(input) {
  if (Array.isArray(input) && typeof input[0] === "string") {
    return input;
  }

  if (Array.isArray(input) && typeof input[0] === "object") {
    return input.map((obj) => String(obj.label || Object.values(obj)[0] || "Unknown"));
  }

  if (input && typeof input === "object" && !Array.isArray(input)) {
    return Object.values(input).map(String);
  }

  return [];
}

const API_SOURCE = process.env.REACT_APP_IMAGE_API_SOURCE || "wikimedia";

export default function ImageFind({
  labels,
  apiKey,
  apiSource = API_SOURCE,
  columns = 2,
  imageHeight = 220,
  showSource = true,
  showLabel = true,
  className = "",
  style = {},
  cardStyle = {},
  labelStyle = {},
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const needsApiKey = apiSource.toLowerCase() !== "wikimedia";

  const fetcher = useCallback(
    (query) => {
      switch (apiSource.toLowerCase()) {
        case "unsplash":
          return fetchFromUnsplash(query, apiKey);
        case "pexels":
          return fetchFromPexels(query, apiKey);
        case "pixabay":
          return fetchFromPixabay(query, apiKey);
        case "wikimedia":
        default:
          return fetchFromWikimedia(query);
      }
    },
    [apiSource, apiKey]
  );

  useEffect(() => {
    const labelList = extractLabels(labels);
    if (!labelList.length || (needsApiKey && !apiKey)) return;

    let cancelled = false;
    setLoading(true);
    setEntries(
      labelList.map((label) => ({
        label,
        url: null,
        width: null,
        height: null,
        source: null,
        status: "loading",
      }))
    );

    const promises = labelList.map(async (label, idx) => {
      try {
        const result = await fetcher(label);
        if (!cancelled) {
          setEntries((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], ...result, status: "done" };
            return next;
          });
        }
      } catch (err) {
        console.error(`ImageFind: failed for "${label}" -`, err.message);
        if (!cancelled) {
          setEntries((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], status: "error", errorMsg: err.message };
            return next;
          });
        }
      }
    });

    Promise.allSettled(promises).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [labels, apiKey, fetcher, needsApiKey]);

  const labelList = extractLabels(labels);

  if (needsApiKey && !apiKey) {
    return (
      <div className={className} style={{ padding: 24, color: "#999", ...style }}>
        <p>
          <strong>ImageFind</strong>: please pass an <code>apiKey</code> prop.
        </p>
      </div>
    );
  }

  if (!labelList.length) {
    return (
      <div className={className} style={{ padding: 24, color: "#999", ...style }}>
        <strong>ImageFind</strong>: no labels provided.
      </div>
    );
  }

  return (
    <div className={className} style={{ ...style }}>
      {loading && (
        <p
          style={{
            textAlign: "center",
            color: "#888",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          Fetching images...
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 16,
        }}
      >
        {entries.map((entry, i) => (
          <div
            key={`${entry.label}-${i}`}
            style={{
              borderRadius: 8,
              overflow: "hidden",
              background: "#111",
              boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
              transition: "transform 0.2s, box-shadow 0.2s",
              ...cardStyle,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.25)";
            }}
          >
            <div
              style={{
                width: "100%",
                height: imageHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#161b22",
                position: "relative",
              }}
            >
              {entry.status === "loading" && <div style={styles.spinner} />}

              {entry.status === "done" && (
                <img
                  src={entry.url}
                  alt={entry.label}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}

              {entry.status === "error" && (
                <div style={styles.errorState}>
                  <span>Image not found</span>
                </div>
              )}
            </div>

            {showLabel && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#0d1117",
                  borderTop: "1px solid #21262d",
                  ...labelStyle,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#e6edf3",
                    textTransform: "capitalize",
                  }}
                >
                  {entry.label}
                </p>
                {showSource && entry.source && entry.status === "done" && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                      color: "#8b949e",
                    }}
                  >
                    via {entry.source}
                    {entry.width && ` - ${entry.width}x${entry.height}`}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #30363d",
    borderTopColor: "#58a6ff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ff7b72",
    fontSize: 13,
    padding: 16,
    textAlign: "center",
  },
};
