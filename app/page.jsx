"use client";

import { useEffect, useMemo, useState } from "react";

const RTL = "\u202B";

function buildCopyText({ term, pronunciation, meaning, definition, imageUrl }) {
  const lines = [
    `${RTL}English term: ${term || ""}`,
    `${RTL}Pronunciation (Arabic letters): ${pronunciation || ""}`,
    `${RTL}المعنى بالعربي: ${meaning || ""}`,
    `${RTL}التعريف/الشرح (بالعربي): ${definition || ""}`,
    imageUrl ? `${RTL}Image (URL): ${imageUrl}` : ""
  ].filter(Boolean);

  return lines.join("\n");
}

export default function Page() {
  const [theme, setTheme] = useState("light");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [term, setTerm] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [meaning, setMeaning] = useState("");
  const [definition, setDefinition] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const copyText = useMemo(
    () => buildCopyText({ term, pronunciation, meaning, definition, imageUrl }),
    [term, pronunciation, meaning, definition, imageUrl]
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  async function onSearch() {
    const q = query.trim();
    if (!q) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/term", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q })
      });

      const rawText = await res.text();
      let data = {};
      try { data = JSON.parse(rawText); } catch { data = { error: rawText }; }

      if (!res.ok || data.error) {
        setError(data.error || `API error (${res.status})`);
        setLoading(false);
        return;
      }

      setTerm(data.term || q);
      setPronunciation(data.pronunciation_ar || "");
      setMeaning(data.meaning_ar || "");
      setDefinition(data.definition_ar || "");

      const imgRes = await fetch(`/api/image?term=${encodeURIComponent(data.term || q)}`);
      if (imgRes.ok) {
        const img = await imgRes.json();
        setImageUrl(img.imageUrl || "");
      } else {
        setImageUrl("");
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    await navigator.clipboard.writeText(copyText);
    alert("Copied ✅");
  }

  function onKeyDown(e) {
    if (e.key === "Enter") onSearch();
  }

  return (
    <div className="page">
      <div className="shell">
        <div className="topbar">
          <div className="brand">Applemed (Private)</div>
          <button className="toggle" onClick={() => setTheme(t => (t === "light" ? "dark" : "light"))}>
            {theme === "light" ? "Night mode" : "Light mode"}
          </button>
        </div>

        {error ? (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="small" style={{ color: "#ffd1d1" }}>
              Error: {error}
            </div>
          </div>
        ) : null}

        <div className="searchRow">
          <input
            className="input"
            placeholder="اكتب المصطلح هنا…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="btn" onClick={onSearch} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        <div className="grid">
          <div className="card imageBox">
            <div className="small">الصورة (من النت)</div>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="img" src={imageUrl} alt="Result" />
            ) : (
              <div className="small">لا توجد صورة مناسبة لهذا المصطلح.</div>
            )}
            {imageUrl ? <div className="small">{imageUrl}</div> : null}
          </div>

          <div className="card fields">
            <div>
              <div className="label">English term</div>
              <textarea className="textarea" value={term} onChange={(e) => setTerm(e.target.value)} />
            </div>

            <div>
              <div className="label">Pronunciation (Arabic letters)</div>
              <textarea className="textarea" value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} />
            </div>

            <div>
              <div className="label">المعنى بالعربي</div>
              <textarea className="textarea" value={meaning} onChange={(e) => setMeaning(e.target.value)} />
            </div>

            <div>
              <div className="label">التعريف/الشرح (بالعربي)</div>
              <textarea className="textarea" value={definition} onChange={(e) => setDefinition(e.target.value)} />
            </div>

            <div className="actions">
              <button className="btn" onClick={copyAll}>Copy all</button>
              <button className="btn" onClick={() => { setQuery(""); setTerm(""); setPronunciation(""); setMeaning(""); setDefinition(""); setImageUrl(""); setError(""); }}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
