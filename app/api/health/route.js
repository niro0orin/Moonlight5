import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    hasBasicUser: Boolean(process.env.BASIC_AUTH_USER),
    hasBasicPass: Boolean(process.env.BASIC_AUTH_PASSWORD)
  });
}
