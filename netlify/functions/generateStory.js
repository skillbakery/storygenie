import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ✅ stored in Netlify env
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

    // ======================
    // 1️⃣ TEXT GENERATION
    // ======================
    const textResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are StoryGenie, a magical storyteller.

Return valid JSON:
{
  "title": "...",
  "story": "..."
}

Topic: ${prompt}
      `,
      temperature: 0.9,
      max_output_tokens: 400,
    });

    const rawText =
      textResponse.output_text ||
      textResponse.output?.[0]?.content?.[0]?.text;

    const cleanText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanText);

    // ======================
    // 2️⃣ IMAGE GENERATION
    // ======================
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Fantasy illustration for "${parsed.title}". ${prompt}, cinematic lighting, digital art`,
      size: "1024x1024",
    });

    const imageUrl = imageResponse.data[0].url;

    // ======================
    // ✅ FINAL RESPONSE
    // ======================
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
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
      body: JSON.stringify({ error: error.message }),
    };
  }
};
