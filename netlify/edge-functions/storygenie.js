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

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",

      input: `
You are StoryGenie.

Return valid JSON:
{
  "title": "...",
  "story": "...",
  "image_prompt": "..."
}

Topic: ${prompt}
      `,

      temperature: 0.9,
      max_output_tokens: 500,

      // ✅ REQUIRED FIELDS
      text: {
        format: {
          type: "json",
        },
      },
    });

    const outputText =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text;

    if (!outputText) {
      throw new Error("No output received from OpenAI");
    }

    const parsed = JSON.parse(outputText);

    return new Response(
      JSON.stringify({
        title: parsed.title,
        story: parsed.story,
        imagePrompt: parsed.image_prompt,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge error:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
