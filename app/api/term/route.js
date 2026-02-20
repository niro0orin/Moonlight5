import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extractOutputText(respJson) {
  // Responses REST: النص داخل output -> message -> content -> output_text.text  [oai_citation:2‡OpenAI](https://platform.openai.com/docs/api-reference/responses)
  const out = respJson?.output;
  if (!Array.isArray(out)) return "";

  let combined = "";
  for (const item of out) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c?.type === "output_text" && typeof c?.text === "string") {
        combined += c.text;
      }
    }
  }
  return combined.trim();
}

export async function POST(req) {
  try {
    const { query } = await req.json();
    const q = String(query || "").trim();
    if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Return ONLY JSON that matches the schema. No extra text."
          },
          {
            role: "user",
            content: `User input (Arabic or English): ${q}

Rules:
- term: MUST be the standard ENGLISH term (even if input Arabic).
- pronunciation_ar: write English pronunciation using Arabic letters.
- meaning_ar: short Arabic meaning.
- definition_ar: short Arabic definition (1–2 sentences).
- Never leave any field empty.`
          }
        ],
        // Structured outputs via text.format  [oai_citation:3‡developers.openai.com](https://developers.openai.com/api/docs/guides/structured-outputs/)
        text: {
          format: {
            type: "json_schema",
            name: "applemed_term",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                term: { type: "string" },
                pronunciation_ar: { type: "string" },
                meaning_ar: { type: "string" },
                definition_ar: { type: "string" }
              },
              required: ["term", "pronunciation_ar", "meaning_ar", "definition_ar"]
            }
          }
        }
      })
    });

    const resp = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        { error: resp?.error?.message || "OpenAI request failed", raw: resp },
        { status: 500 }
      );
    }

    const text = extractOutputText(resp);
    if (!text) {
      return NextResponse.json(
        { error: "Empty model output", raw: resp },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "JSON parse failed", raw_text: text, raw: resp },
        { status: 500 }
      );
    }

    // ضمان حد أدنى حتى لو صار شيء غريب
    return NextResponse.json({
      term: String(parsed.term || ""),
      pronunciation_ar: String(parsed.pronunciation_ar || ""),
      meaning_ar: String(parsed.meaning_ar || ""),
      definition_ar: String(parsed.definition_ar || "")
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
