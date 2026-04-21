// Calls Groq Cloud API for activity suggestions.
// Falls back to static suggestions if no API key is set.
import Constants from "expo-constants";

const GROQ_API_KEY =
  Constants.expoConfig?.extra?.GROQ_API_KEY || process.env.GROQ_API_KEY || "";
const GROQ_MODEL =
  Constants.expoConfig?.extra?.GROQ_MODEL ||
  process.env.GROQ_MODEL ||
  "llama-3.1-8b-instant";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─── Fallback suggestions (used when API key is missing) ─────────────────────

const FALLBACK_SUGGESTIONS = (destination) => [
  {
    name: `Explore ${destination} City Centre`,
    description:
      "Walk through the main streets and discover local architecture and culture.",
    approximate_cost: "Free",
    suggested_time_of_day: "Morning",
  },
  {
    name: "Local Food Market",
    description:
      "Sample authentic street food and local specialties at a bustling market.",
    approximate_cost: "$5–$20 per person",
    suggested_time_of_day: "Morning",
  },
  {
    name: "Museum or Cultural Site",
    description: "Visit the most famous museum or heritage site in the area.",
    approximate_cost: "$10–$25 per person",
    suggested_time_of_day: "Afternoon",
  },
  {
    name: "Sunset Viewpoint",
    description:
      "Head to the best viewpoint in the city to watch the sunset together.",
    approximate_cost: "Free",
    suggested_time_of_day: "Evening",
  },
  {
    name: "Group Dinner at Local Restaurant",
    description: "Enjoy a communal dinner featuring regional cuisine.",
    approximate_cost: "$15–$40 per person",
    suggested_time_of_day: "Evening",
  },
];

/**
 * Fetches AI-generated activity suggestions for a trip.
 * @param {string} destination - Trip destination
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Promise<Array>} Array of activity suggestion objects
 */
export const suggestActivities = async (destination, startDate, endDate) => {
  if (!GROQ_API_KEY || GROQ_API_KEY === "YOUR_GROQ_API_KEY") {
    console.log("No Groq API key found – using fallback suggestions.");
    // Simulate a short delay to show loading state
    await new Promise((r) => setTimeout(r, 800));
    return FALLBACK_SUGGESTIONS(destination);
  }

  const prompt = `Suggest 5 interesting activities for a group trip to ${destination} from ${startDate} to ${endDate}.
Return ONLY a valid JSON array (no markdown, no explanation) with objects having these fields:
- name (string)
- description (string, 1-2 sentences)
- approximate_cost (string, e.g. "Free" or "$10-$20 per person")
- suggested_time_of_day (string: "Morning", "Afternoon", or "Evening")

Example format:
[{"name":"...","description":"...","approximate_cost":"...","suggested_time_of_day":"..."}]`;

  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Groq API error:", err);
    // Fall back gracefully
    return FALLBACK_SUGGESTIONS(destination);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content || "[]";

  try {
    // Strip possible markdown code fences
    const cleaned = content.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(cleaned);
    if (!Array.isArray(suggestions)) throw new Error("Not an array");
    return suggestions;
  } catch (e) {
    console.error("Failed to parse AI response:", e, content);
    return FALLBACK_SUGGESTIONS(destination);
  }
};
