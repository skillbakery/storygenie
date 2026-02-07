import OpenAI from "openai";

export default async (request, context) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({
      apiKey: Netlify.env.get("OPENAI_API_KEY"),
    });

    // =====================
    // 1️⃣ TEXT GENERATION
    // =====================
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
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const raw =
      textResponse.output_text ||
      textResponse.output?.[0]?.content?.[0]?.text;

    const parsed = JSON.parse(raw);

    // =====================
    // 2️⃣ IMAGE GENERATION
    // =====================
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Fantasy illustration for "${parsed.title}". ${prompt}, cinematic lighting, digital art`,
      size: "1024x1024",
    });

    const imageUrl = imageResponse.data[0].url;

    // =====================
    // ✅ FINAL RESPONSE
    // =====================
    return new Response(
      JSON.stringify({
        title: parsed.title,
        story: parsed.story,
        imageUrl,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[storygenie] Edge error:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
