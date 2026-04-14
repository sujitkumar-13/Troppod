import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is missing. Running in MOCK MODE.");
      return null;
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

export async function analyzeAd(adInput: string) {
  const client = getOpenAI();
  
  if (!client) {
    // Dynamic Mock Response based on input
    const input = adInput.toLowerCase();
    const percentMatch = adInput.match(/(\d+%)/);
    const offer = percentMatch ? `Simulated Offer: ${percentMatch[1]} Off` : "Simulated Special Offer";
    
    // Attempt to guess category
    let topic = "Products";
    if (input.includes("shoe")) topic = "Shoes";
    if (input.includes("elect") || input.includes("phone") || input.includes("gadget")) topic = "Electronics";
    if (input.includes("cloth") || input.includes("fashion")) topic = "Apparel";

    return {
      offer,
      tone: "Professional & Persuasive",
      audience: "Targeted Customers",
      message: `Personalize for ${topic} with ${offer}.`,
      cta: `Get ${topic} Now`,
      _mockTopic: topic // Internal helper for personalization mock
    };
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert marketing analyst. Return JSON only.",
      },
      {
        role: "user",
        content: `Analyze the following ad creative and extract:
1. Offer (discount, urgency, benefit)
2. Tone (luxury, urgent, casual, premium)
3. Target audience
4. Key messaging
5. Suggested CTA

Ad:
${adInput}

Return JSON only:
{
  "offer": "",
  "tone": "",
  "audience": "",
  "message": "",
  "cta": ""
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function personalizeHtml(adAnalysisJson: any, textContent: any) {
  const client = getOpenAI();

  if (!client) {
    // Basic Mock Personalization: Use the dynamic data
    const topic = (adAnalysisJson as any)._mockTopic || "Your Needs";
    return {
      headline: `${adAnalysisJson.offer}: Personalized for ${topic}`,
      cta: adAnalysisJson.cta || "Shop Now"
    };
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a CRO expert. You will receive existing page content and ad creative data. Your task is to provide personalized improvements for specific elements. Return JSON only.",
      },
      {
        role: "user",
        content: `Ad Data:
${JSON.stringify(adAnalysisJson, null, 2)}

Existing Page Content:
${JSON.stringify(textContent, null, 2)}

TASK:
Provide better versions of the headline and primary CTA text.
Return JSON only:
{
  "headline": "Improved Headline",
  "cta": "Improved CTA Text"
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}
