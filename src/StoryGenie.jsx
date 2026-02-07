import { useState } from "react";
import OpenAI from "openai";
import "./StoryGenie.css";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

export default function StoryGenie() {
  const [prompt, setPrompt] = useState("");
  const [story, setStory] = useState("");
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  const generateStory = async () => {
    if (!prompt) return;

    setLoading(true);
    setStory("");
    setTitle("");
    setImage("");

    try {
      // ============================
      // 1️⃣ TEXT GENERATION
      // ============================
      const textResponse = await openai.responses.create({
        model: "gpt-4.1-mini",

        /**
         * input: What we send to the model.
         * We ask for JSON so parsing becomes easy in UI.
         */
        input: `
          You are StoryGenie, a magical storyteller.
          Create:
          1. A short creative TITLE.
          2. A short STORY.

          Return JSON like:
          {
            "title": "...",
            "story": "..."
          }

          Topic: ${prompt}
        `,

        /**
         * temperature controls creativity.
         * 0 = deterministic
         * 1 = very creative
         */
        temperature: 0.9,

        /**
         * max_output_tokens limits response length.
         */
        max_output_tokens: 400,
      });

      // Extract text output
      const rawText =
        textResponse.output_text ||
        textResponse.output?.[0]?.content?.[0]?.text;
      // Clean markdown formatting if present
      const cleanText = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanText);

      setTitle(parsed.title);
      setStory(parsed.story);

      // ============================
      // 2️⃣ IMAGE GENERATION
      // ============================
      const imageResponse = await openai.images.generate({
        /**
         * prompt describes the image to generate.
         * We enrich it for better visuals.
         */
        prompt: `Fantasy illustration for a story titled "${parsed.title}". ${prompt}, cinematic lighting, digital art.`,

        size: "1024x1024",
      });

      setImage(imageResponse.data[0].url);
    } catch (err) {
      console.error(err);
      alert("Something went wrong generating the story.");
    }

    setLoading(false);
  };

  return (
    <div className="container genie-container text-center">
      <div className="genie-card shadow-lg p-4">
        <div className="avatar">🧞‍♂️</div>

        <h2>StoryGenie</h2>
        <p>Give me an idea and I’ll create magic ✨</p>

        <input
          className="form-control mt-3"
          placeholder="Enter your story idea..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button className="btn btn-primary mt-3 w-100" onClick={generateStory}>
          {loading ? "Summoning Magic..." : "Generate Story"}
        </button>

        {(title || story) && (
          <div className="story-box mt-4">
            {image && <img src={image} className="story-image" />}
            <h4 className="mt-3">{title}</h4>
            <p>{story}</p>
          </div>
        )}
      </div>
    </div>
  );
}
