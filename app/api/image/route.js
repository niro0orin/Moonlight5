import { NextResponse } from "next/server";

export const runtime = "nodejs";

// يجلب صورة من النت عبر Wikipedia search (MediaWiki API)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const term = String(searchParams.get("term") || "").trim();
    if (!term) return NextResponse.json({ imageUrl: "" });

    const api = new URL("https://en.wikipedia.org/w/api.php");
    api.searchParams.set("action", "query");
    api.searchParams.set("format", "json");
    api.searchParams.set("origin", "*");
    api.searchParams.set("generator", "search");
    api.searchParams.set("gsrsearch", term);
    api.searchParams.set("gsrlimit", "1");
    api.searchParams.set("prop", "pageimages");
    api.searchParams.set("piprop", "thumbnail");
    api.searchParams.set("pithumbsize", "900");

    const r = await fetch(api.toString(), {
      headers: { "User-Agent": "ApplemedPrivate/1.0" }
    });

    if (!r.ok) return NextResponse.json({ imageUrl: "" });

    const data = await r.json();
    const pages = data?.query?.pages;
    if (!pages) return NextResponse.json({ imageUrl: "" });

    const firstKey = Object.keys(pages)[0];
    const thumb = pages[firstKey]?.thumbnail?.source || "";

    return NextResponse.json({ imageUrl: thumb });
  } catch {
    return NextResponse.json({ imageUrl: "" });
  }
}
