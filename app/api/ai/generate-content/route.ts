import { NextResponse } from "next/server";
import OpenAI from "openai";
import { logError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI is not configured. Set OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const { businessName, businessWebsite, town, category, prompt } = await request.json();

    if (!businessName) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    // Build a comprehensive prompt for generating blog content
    const systemPrompt = `You are a professional travel and lifestyle writer for the Garden Route region of South Africa. 
Your writing style is engaging, informative, and highlights the unique qualities of local businesses.
Write in a warm, inviting tone that makes readers want to visit these places.
Focus on what makes each business special, their offerings, atmosphere, and why locals love them.
Each paragraph should be substantial (3-4 sentences minimum).`;

    const userPrompt = prompt || `Write 3 detailed paragraphs about ${businessName}, a ${category} business in ${town}, Garden Route, South Africa.
${businessWebsite ? `Their website is ${businessWebsite} - use this to understand what they offer.` : ''}

The content should:
1. First paragraph: Introduce the business and what makes it stand out in the local scene
2. Second paragraph: Describe their offerings, atmosphere, and unique features in detail
3. Third paragraph: Explain why this business is a must-visit and what keeps customers coming back

Format each paragraph with <p> tags. Do not include any headings.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ content, success: true });
  } catch (error) {
    logError("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate content", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
