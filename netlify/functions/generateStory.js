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

    // ======================
    // 1️⃣ STORY GENERATION
    // ======================
    const textResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are StoryGenie, a magical storyteller.",
        },
        {
          role: "user",
          content: `Return ONLY valid JSON like this:
{
  "title": "...",
  "story": "..."
}

Topic: ${prompt}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_output_tokens: 500,
    });

    const parsed = textResponse.output_parsed;

    if (!parsed?.title || !parsed?.story) {
      throw new Error("Invalid story response from OpenAI");
    }

    // ======================
    // 2️⃣ IMAGE GENERATION
    // ======================
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Fantasy illustration for "${parsed.title}". ${prompt}. cinematic lighting, digital art, high detail`,
      size: "1024x1024",
    });

    if (!imageResponse.data?.length) {
      throw new Error("Image generation failed");
    }

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
      body: JSON.stringify({
        error: error.message || "Internal Server Error",
      }),
    };
  }
};
