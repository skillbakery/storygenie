import OpenAI from "openai";

export default async (request: Request) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
      });
    }

    const openai = new OpenAI({
      apiKey: Netlify.env.get("OPENAI_API_KEY"),
    });

    // ======================
    // 1️⃣ TEXT
    // ======================
    const textResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are StoryGenie. Return valid JSON only.",
        },
        {
          role: "user",
          content: `Create a short title and story about: ${prompt}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          json_schema: {
            name: "story",
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                story: { type: "string" },
              },
              required: ["title", "story"],
            },
          },
        },
      },
      max_output_tokens: 250,
      temperature: 0.8,
    });

    const parsed = textResponse.output_parsed;

    // ======================
    // 2️⃣ IMAGE
    // ======================
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Fantasy illustration for "${parsed.title}". ${prompt}, cinematic lighting, digital art`,
      size: "1024x1024",
    });

    return new Response(
      JSON.stringify({
        title: parsed.title,
        story: parsed.story,
        imageUrl: imageResponse.data[0].url,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Edge error:", error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
