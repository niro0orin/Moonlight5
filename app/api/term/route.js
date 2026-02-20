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
حوّل المصطلح التالي إلى JSON فقط بدون أي نص إضافي:

${q}

الشكل المطلوب:
{
"term": "English term only",
"pronunciation_ar": "النطق بالحروف العربية",
"meaning_ar": "المعنى بالعربي",
"definition_ar": "تعريف عربي مختصر"
}

قواعد:
- term لازم يكون إنجليزي دائمًا حتى لو الإدخال عربي
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

    const text = data.output[0].content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({
        error: "JSON parsing failed",
        raw: text
      }, { status: 500 });
    }

    return NextResponse.json(parsed);

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
