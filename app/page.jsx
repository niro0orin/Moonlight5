"use client";

import { useState } from "react";

export default function Page() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  async function handleSearch() {
    const res = await fetch("/api/term", {
      method: "POST",
      body: JSON.stringify({ query: input }),
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <input
        placeholder="اكتب المصطلح"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ padding: 10, width: "60%" }}
      />

      <button onClick={handleSearch} style={{ marginLeft: 10 }}>
        Search
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <p><b>English:</b> {result.term}</p>
          <p><b>Pronunciation:</b> {result.pronunciation_ar}</p>
          <p><b>Arabic:</b> {result.meaning_ar}</p>
          <p><b>Definition:</b> {result.definition_ar}</p>

          <button
            onClick={() => {
              const text = `English term: ${result.term}
Pronunciation: ${result.pronunciation_ar}
المعنى: ${result.meaning_ar}
التعريف: ${result.definition_ar}`;
              navigator.clipboard.writeText(text);
            }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
