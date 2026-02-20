export async function POST(req) {
  const { query } = await req.json();

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: `
اعطني النتيجة بهذا الشكل فقط JSON:

{
"term": "",
"pronunciation_ar": "",
"meaning_ar": "",
"definition_ar": ""
}

المصطلح: ${query}
`
    })
  });

  const data = await res.json();

  try {
    const text = data.output[0].content[0].text;
    return Response.json(JSON.parse(text));
  } catch {
    return Response.json({
      term: query,
      pronunciation_ar: "",
      meaning_ar: "خطأ",
      definition_ar: "لم يتم التحليل"
    });
  }
}
