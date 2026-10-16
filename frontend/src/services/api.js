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

// ============================================================
// OCCUPATION & SKILLS EXPLORER
// ============================================================

export const searchOccupations = async (
  search = "",
  limit = 8
) => {

  const params =
    new URLSearchParams();

  if (search.trim()) {
    params.set(
      "search",
      search.trim()
    );
  }

  params.set(
    "limit",
    String(limit)
  );


  const response =
    await fetch(
      `${API_BASE_URL}/occupations?${params.toString()}`
    );


  if (!response.ok) {

    throw new Error(
      "Failed to load occupation information"
    );
  }


  return response.json();
};


export const getOccupationDetails = async (
  escoCode
) => {

  const response =
    await fetch(
      `${API_BASE_URL}/occupations/${encodeURIComponent(
        escoCode
      )}`
    );


  if (!response.ok) {

    throw new Error(
      "Failed to load occupation details"
    );
  }


  return response.json();
};