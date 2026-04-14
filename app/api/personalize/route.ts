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

    // 2. Fetch Landing Page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const originalHtml = await response.text();

    // 3. Extract relevant part
    const $ = cheerio.load(originalHtml);
    const existingContent = {
      headline: $("h1").first().text().trim(),
      cta: $("button, a").filter((i, el) => {
        const t = $(el).text().toLowerCase();
        return t.includes("shop") || t.includes("buy") || t.includes("get") || t.includes("now");
      }).first().text().trim()
    };

    // 4. Personalize Content (Surgical)
    const personalizedContent = await personalizeHtml(adAnalysis, existingContent);

    // 5. Reconstruct Page Surgically
    const $final = cheerio.load(originalHtml);
    
    if (personalizedContent.headline) {
      // Find the h1 and update its inner text while preserving inner structure if possible
      // For now, we'll replace the text of the first H1
      $final("h1").first().text(personalizedContent.headline);
    }
    
    if (personalizedContent.cta) {
      $final("button, a").filter((i, el) => {
        const t = $final(el).text().toLowerCase();
        return t.includes("shop") || t.includes("buy") || t.includes("get") || t.includes("now");
      }).first().text(personalizedContent.cta);
    }

    // Inject <base> tag to fix relative assets in iframes
    const injectBase = (html: string, baseUrl: string) => {
      if (html.includes("<base")) return html;
      // Robust regex for <head> to handle attributes or whitespace
      return html.replace(/<head\b[^>]*>/i, `$&<base href="${baseUrl}">`);
    };

    const finalOriginal = injectBase(originalHtml, url);
    const finalPersonalized = injectBase($final.html(), url);

    return NextResponse.json({
      adAnalysis,
      originalHtml: finalOriginal,
      personalizedHtml: finalPersonalized,
      highlights: [
        { type: "Headline", reason: "Aligned with ad offer" },
        { type: "CTA", reason: "Increased urgency" }
      ]
    });
  } catch (error: any) {
    console.error("Personalization error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
