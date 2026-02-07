import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { prompt } = JSON.parse(event.body || "{}");

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Prompt is required" }),
      };
    }

    // ============================
    // 1️⃣ TEXT GENERATION
    // ============================
    const textResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are StoryGenie, a magical storyteller.

Create:
1. A creative title
2. A short story

Return JSON only:
{
  "title": "...",
  "story": "..."
}

Topic: ${prompt}
      `,
      temperature: 0.9,
      max_output_tokens: 400,
      text: {
        format: { type: "json_object" },
      },
    });

    const rawText = textResponse.output_text;

    if (!rawText) {
      throw new Error("No text returned from OpenAI");
    }

    const parsed = JSON.parse(rawText);

    // ============================
    // 2️⃣ IMAGE GENERATION
    // ============================
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Fantasy illustration for a story titled "${parsed.title}". ${prompt}, cinematic lighting, digital art.`,
      size: "1024x1024",
    });

    const imageUrl = imageResponse.data[0].url;

    // ============================
    // ✅ FINAL RESPONSE
    // ============================
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: parsed.title,
        story: parsed.story,
        imageUrl,
      }),
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error.message || "Story generation failed",
      }),
    };
  }
};
