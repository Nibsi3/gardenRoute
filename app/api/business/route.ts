import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI is not configured. Set OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const { businessName, category, zone, phone, meta } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert local journalist and business analyst for the Garden Route, South Africa. Your goal is to write deeply insightful, engaging, and SEO-optimized feature articles about local businesses. You understand the local culture, geography (George, Wilderness, Knysna, Plett), and the specific value proposition of the business. formatting should include HTML tags for structure (h2, p, ul, li).`,
        },
        {
          role: "user",
          content: `Write a comprehensive, high-quality feature article about ${businessName}, a ${category} business located in ${zone}.

CRITICAL REQUIREMENTS:
1.  **Deep Understanding**: Analyze *why* this business is successful/important. specific context about its location in ${zone}.
2.  **Length**: You MUST write a MINIMUM of 3 full, substantial paragraphs for the main body content, plus lists and details. The total length should be substantial (800+ words).
3.  **Structure**:
    *   **Introduction**: A strong hook about the business and its role in the community.
    *   **The "Default" Status**: Why locals and visitors choose this over competitors (analyze convenience, quality, trust).
    *   **Detailed Offerings**: Go deep into their products/services.
    *   **Local Impact**: Connection to the Garden Route lifestyle.
    *   **Business Details Card**: (I will insert this programmatically, but you provide the narrative context around it).

MANDATORY SECTIONS (Use <h2> tags):
*   Why ${businessName} is the First Choice
*   The Experience & Offerings
*   Local Connection & Convenience

Tone: Professional, enthusiastic, trustworthy, and local.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ content });
  } catch (error) {
    logError("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

