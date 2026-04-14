import { NextRequest, NextResponse } from "next/server";
import { analyzeAd, personalizeHtml } from "../../../lib/openai";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { adInput, url } = await req.json();

    if (!adInput || !url) {
      return NextResponse.json({ error: "Missing adInput or url" }, { status: 400 });
    }

    // 1. Analyze Ad
    const adAnalysis = await analyzeAd(adInput);

    // 2. Fetch Landing Page with Proxy Fallback
    let originalHtml = "";
    try {
      // SSL Fix for prototype environment
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Blocked");
      originalHtml = await res.text();
    } catch (e) {
      console.log("Direct fetch failed or timed out, applying proxy fallback...");
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Failed to fetch via proxy: ${res.statusText}`);
      originalHtml = await res.text();
    }

    // 3. Extract relevant part
    const $ = cheerio.load(originalHtml);
    const h1 = $("h1").first();
    const ctaBtn = $("button, a").filter((i, el) => {
      const t = $(el).text().toLowerCase();
      return t.includes("shop") || t.includes("buy") || t.includes("get") || t.includes("now");
    }).first();

    const existingContent = {
      headline: h1.text().trim(),
      cta: ctaBtn.text().trim()
    };

    // 4. Personalize Content (Surgical)
    const personalizedContent = await personalizeHtml(adAnalysis, existingContent);

    // 5. Reconstruct Page Surgically
    const $final = cheerio.load(originalHtml);
    
    // Highlight helper
    const highlight = (text: string) => `<span style="background: #fef08a; color: #1a1a1a; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${text}</span>`;

    if (personalizedContent.headline) {
      $final("h1").first().html(highlight(personalizedContent.headline));
    }
    
    if (personalizedContent.cta) {
      $final("button, a").filter((i, el) => {
        const t = $final(el).text().toLowerCase();
        return t.includes("shop") || t.includes("buy") || t.includes("get") || t.includes("now");
      }).first().html(highlight(personalizedContent.cta));
    }

    // Inject <base> tag to fix relative assets in iframes
    const injectBase = (html: string, baseUrl: string) => {
      if (html.includes("<base")) return html;
      return html.replace(/<head\b[^>]*>/i, `$&<base href="${baseUrl}">`);
    };

    const finalOriginal = injectBase(originalHtml, url);
    const finalPersonalized = injectBase($final.html(), url);

    return NextResponse.json({
      adAnalysis,
      originalHtml: finalOriginal,
      personalizedHtml: finalPersonalized,
      highlights: personalizedContent.explanation || [
        { type: "Headline", reason: "Aligned with ad offer" },
        { type: "CTA", reason: "Increased urgency" }
      ]
    });
  } catch (error: any) {
    console.error("Personalization error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
