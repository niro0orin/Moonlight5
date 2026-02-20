import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { query } = await req.json();
    const q = String(query || "").trim();
    if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    // Structured Outputs (json_schema) لضمان JSON صحيح ومفاتيح كاملة
    const body = {
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You format a single term into Arabic learning fields. Output must follow the JSON schema strictly."
        },
        {
          role: "user",
          content: `Term: ${q}

Rules:
- term: write the English term exactly as commonly used (capitalize normally).
- pronunciation_ar: write how to pronounce it using Arabic letters (approximation is fine).
- meaning_ar: short Arabic meaning/translation.
- definition_ar: short Arabic definition (1–2 sentences), no extra talk.
- If the term is not medical, still do the same format (general meaning + short definition).`
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

    // مع json_schema غالبًا output_text يكون JSON جاهز
    const text = out.output_text || "";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // احتياط: التقط أول كائن JSON من النص
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first === -1 || last === -1) throw new Error("Model did not return JSON.");
      data = JSON.parse(text.slice(first, last + 1));
    }

    // تنظيف بسيط
    const safe = {
      term: String(data.term || q),
      pronunciation_ar: String(data.pronunciation_ar || ""),
      meaning_ar: String(data.meaning_ar || ""),
      definition_ar: String(data.definition_ar || "")
    };

    return NextResponse.json(safe);
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
