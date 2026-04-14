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
    // Fully Dynamic Mock Simulation (Regex-based)
    const input = adInput.trim();
    const percentMatch = input.match(/(\d+%)/);
    const offer = percentMatch ? `${percentMatch[1]} Off` : "Exclusive Offer";
    
    // Extract main topic: everything after common prepositions or first significant phrase
    let topic = "Special Collection";
    const topicMatch = input.match(/(?:on|for|of|in|buy)\s+([^.-]+)/i);
    if (topicMatch && topicMatch[1]) {
      topic = topicMatch[1].trim();
      // Capitalize first letter of each word for a better look
      topic = topic.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    } else {
      // Fallback: look for capitalized words that aren't common starting words
      const words = input.split(" ");
      for (let i = 1; i < words.length; i++) {
        if (words[i][0] === words[i][0].toUpperCase() && words[i].length > 3) {
          topic = words[i];
          break;
        }
      }
    }

    return {
      offer,
      tone: "Persuasive & Professional",
      audience: "High-intent consumers",
      message: `Dynamic personalization for ${topic} with ${offer}`,
      cta: `Shop ${topic} Now`,
      _mockTopic: topic
    };
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a senior marketing strategist and CRO expert. Analyze ad copy and extract core value propositions. Return JSON only.",
      },
      {
        role: "user",
        content: `Ad Copy: "${adInput}"

Extract:
1. offer: The main discount or benefit
2. tone: The psychological tone (e.g., luxury, sense of urgency, helpful)
3. audience: Who is this ad targeting?
4. message: A 1-sentence summary of the hook
5. cta: A recommended call-to-action string

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
    // Fully Dynamic Mock Personalization
    const topic = (adAnalysisJson as any)._mockTopic || "this Collection";
    const offer = adAnalysisJson.offer || "Special Savings";
    
    return {
      headline: `Get ${offer} on ${topic} Today!`,
      cta: `Shop ${topic} Now`,
      explanation: [
        { type: "Headline", reason: `Dynamic alignment with the ${offer} mentioned in your ad.` },
        { type: "CTA", reason: `Context-specific action for ${topic} keyword.` }
      ]
    };
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a world-class Conversion Rate Optimization (CRO) expert. Your goal is to rewrite website text to perfectly match an advertisement's messaging. Avoid generic boilerplate. Be specific, punchy, and persuasive.",
      },
      {
        role: "user",
        content: `AD DATA:
${JSON.stringify(adAnalysisJson, null, 2)}

EXISTING PAGE CONTENT:
${JSON.stringify(textContent, null, 2)}

TASK:
1. headline: Rewrite the H1 to match the ad's offer and tone. Be extremely specific to the product/service mentioned.
2. cta: Rewrite the button text to be more compelling and relevant to the ad.
3. explanation: Provide a 1-sentence reason for each change.

STRICT RULES:
- NO generic placeholders like 'Products' or 'Your Needs'.
- Match the ad's specific offer and messaging.
- Maintain the original tone (luxury should stay luxury, etc.).

Return JSON only:
{
  "headline": "Personalized Headline",
  "cta": "Compelling CTA",
  "explanation": [
    { "type": "Headline", "reason": "" },
    { "type": "CTA", "reason": "" }
  ]
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}
