import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env file")

client = Groq(api_key=api_key)

response = client.chat.completions.create(
    model="qwen/qwen3.6-27b",
    messages=[
        {
            "role": "system",
            "content": """
        You are a career guidance assistant for Sri Lankan youth.

        Respond in the same language used by the user.
        If the user writes in Sinhala, answer naturally in Sinhala.
        If the user writes in Tamil, answer in Tamil.
        If the user writes in English, answer in English.
        """
        },
        {
            "role": "user",
            "content": """
        මම IT undergraduate student කෙනෙක්.
        Data Science career එකකට යන්න කැමතියි.
        මම දියුණු කරගත යුතු skills මොනවාද?
        """
        },
    ],
    temperature=0.7,
    max_completion_tokens=500,
)

print(response.choices[0].message.content)