export async function analyzeUser(data) {
  const response = await fetch("http://127.0.0.1:8000/analyze", {
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

  const response = await fetch("http://127.0.0.1:8000/chat", {
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