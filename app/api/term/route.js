import { NextResponse } from "next/server";

export const runtime = "nodejs";

function norm(s) {
  return String(s || "").trim();
}

export async function POST(req) {
  try {
    const { query } = await req.json();
    const q = norm(query);
    if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

    const body = {
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are Applemed. Always return STRICT JSON per schema. No extra text."
        },
        {
          role: "user",
          content: `
User input (may be Arabic or English, may be a phrase): ${q}

Return STRICT JSON with keys:
term: string (MUST be the standard ENGLISH term. If user input is Arabic, translate to the most common English medical term. If non-medical, translate to common English word.)
pronunciation_ar: string (Arabic letters approximating the ENGLISH pronunciation, e.g. Osteomyelitis -> أوستيومايلايتِس)
meaning_ar: string (short Arabic meaning/translation)
definition_ar: string (short Arabic definition, 1–2 sentences, no extra talk)

Rules:
- term MUST be English even if input is Arabic.
- Never leave pronunciation_ar/meaning_ar/definition_ar empty. If uncertain, give best approximation.
- Keep definition_ar concise and factual.
`.trim()
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
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
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: t || "OpenAI request failed" }, { status: 500 });
    }

    const out = await r.json();
    const text = out.output_text || "";
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      // fallback: pick first JSON object from text
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first === -1 || last === -1) throw new Error("Model did not return JSON.");
      data = JSON.parse(text.slice(first, last + 1));
    }

    // ضمان عدم الفراغ
    const safe = {
      term: norm(data.term) || (/[A-Za-z]/.test(q) ? q : "Term"),
      pronunciation_ar: norm(data.pronunciation_ar) || "—",
      meaning_ar: norm(data.meaning_ar) || "—",
      definition_ar: norm(data.definition_ar) || "—"
    };

    return NextResponse.json(safe);
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
