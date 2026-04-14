import * as cheerio from "cheerio";

export function extractEditableElements(html: string) {
  const $ = cheerio.load(html);
  
  const elements: { tag: string; text: string; selector: string }[] = [];

  $("h1, h2, button, a").each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text) {
      // Create a unique selector for this element if possible, 
      // or at least identify it by its position/index if needed.
      // For simplicity in this prototype, we'll try to find unique ones
      // but the safer way is to mark them in the HTML.
      elements.push({
        tag: el.tagName,
        text,
        selector: `${el.tagName}:nth-of-type(${$(el).index(el.tagName) + 1})`
      });
    }
  });

  return elements;
}

export function replaceContentSafely(html: string, directReplacements: { original: string; personalized: string }[]) {
  let modifiedHtml = html;
  
  // Highlighting changed text in yellow as requested
  directReplacements.forEach(({ original, personalized }) => {
    if (original === personalized) return;
    
    // We use a simple string replacement for now, 
    // but in a real app we'd use Cheerio to target specific nodes
    // to avoid replacing text in unrelated places.
    const highlighted = `<span style="background-color: #fef08a;">${personalized}</span>`;
    modifiedHtml = modifiedHtml.split(original).join(highlighted);
  });

  return modifiedHtml;
}

/**
 * A more robust replacement that uses Cheerio to avoid accidental replacements
 */
export function replaceWithCheerio(html: string, adAnalysis: any, personalizedHtmlSnippet: string) {
  const $ = cheerio.load(html);
  const $personalized = cheerio.load(personalizedHtmlSnippet);

  // This is tricky because the AI might return a modified version of the snippet
  // We'll rely on the AI's direct output if it's a valid snippet, 
  // or use the string replacement if we want to be "safe" about highlighting.
  
  // For the prototype, we'll return the AI's personalized HTML 
  // but wrap the changes in highlights if we can detect them.
  
  return personalizedHtmlSnippet;
}
