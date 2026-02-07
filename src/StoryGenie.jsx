import { useState } from "react";
import "./StoryGenie.css";

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
    const res = await fetch("/api/storygenie", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt }),
});

    const data = await res.json();

    setTitle(data.title);
    setStory(data.story);
    setImage(data.imageUrl);
  } catch (err) {
    console.error(err);
    alert("StoryGenie magic failed 😢");
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
