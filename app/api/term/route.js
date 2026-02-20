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

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
اعطني JSON فقط:

{
"term": "",
"pronunciation_ar": "",
"meaning_ar": "",
"definition_ar": ""
}

المصطلح: ${q}

قواعد:
- term لازم يكون إنجليزي دائمًا
- لا تترك أي خانة فارغة
        `,
        text: {
          format: {
            type: "json_object"
          }
        }
      })
    });

    const data = await response.json();

    // 🔥 الحل هنا: استخدام output_text (أضمن)
    const text = data.output_text;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({
        error: "JSON parse failed",
        raw: text
      }, { status: 500 });
    }

    return NextResponse.json(parsed);

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
