import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function withTimeout(promise, ms = 9000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("OpenAI request timed out")), ms)
    ),
  ]);
}

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

    const response = await withTimeout(
      openai.responses.create({
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
        max_output_tokens: 280,
        temperature: 0.8,
      }),
      9000
    );

    const parsed = response.output_parsed;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (error) {
    console.error("storyText error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
