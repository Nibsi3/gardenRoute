import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { businessName, category, zone, phone, meta } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional content writer specializing in creating engaging, SEO-friendly business profiles for the Garden Route region of South Africa. Write in a warm, professional tone that highlights the business's strengths and community value.`,
        },
        {
          role: "user",
          content: `Write a comprehensive, engaging article about ${businessName}, a ${category} business located in ${zone}. 
          
Include:
1. An engaging introduction about the business
2. Services/products offered
3. Why they're a trusted choice in the Garden Route
4. Community impact and local presence
5. Contact information: ${phone}, ${meta}

Make it approximately 800-1000 words, well-structured with headings, and include natural mentions of the Garden Route location.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

