const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

export async function analyzeUser(data) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("API Error");
  }

  return await response.json();
}


export const chatWithBot = async ({
  message,
  employabilityProfile,
  conversationHistory = [],
  uploadedDocument = null,
}) => {

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      employabilityProfile,
      conversationHistory,
      uploadedDocument,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get chatbot response");
  }

  return response.json();
};