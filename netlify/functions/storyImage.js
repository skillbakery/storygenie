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

    const { title, prompt } = JSON.parse(event.body || "{}");

    if (!title || !prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "title and prompt are required" }),
      };
    }

    const imageResponse = await withTimeout(
      openai.images.generate({
        model: "gpt-image-1",
        prompt: `Fantasy illustration for "${title}". ${prompt}, cinematic lighting, digital art`,
        size: "1024x1024",
      }),
      9000
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: imageResponse.data[0].url,
      }),
    };
  } catch (error) {
    console.error("storyImage error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
