export const translations = {
  en: {
    welcome:
      "Welcome to the Employability AI Assistant",

    intro:
      "I’ll have a short conversation with you to understand your background, skills, and employability potential",

    start:
      "Start Chat",

    finish:
      "Generate My Employability Analysis",

    questions: [
      {
        key: "age",
        type: "choice",
        question: "To begin, may I know your age ?",
        options: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
      },

      {
        key: "gender",
        type: "choice",
        question: "Thanks! What gender do you identify with?",
        options: ["Male", "Female"]
      },

      {
        key: "Edu_Level",
        type: "choice",
        question: "Tell me about your educational background. What is the highest qualification you have completed?",
        options: [
          "G.C.E O/L",
          "G.C.E A/L",
          "Certificate / NVQ Level 3–4",
          "Diploma / HND / NVQ Level 5–6",
          "Bachelor's Degree",
          "Postgraduate Qualification"
        ]
      },

      {
        key: "field_of_study",
        type: "choice",
        question: "Nice! Which field best matches your area of study?",
        options: [
          "IT",
          "Business",
          "Engineering",
          "Vocational",
          "Arts",
          "Science",
          "General"
        ]
      },

      {
        key: "Skill_Analytical",
        type: "rating",
        question: "Let’s talk about your professional skills. How confident are you in your analytical thinking abilities?",
        description:
          "Your ability to break down complicated problems and make decisions using facts.",
        scaleLabels: [
          "Very low",
          "Low",
          "Moderate",
          "Good",
          "Very good"
        ]
      },

      {
        key: "Skill_Resilience",
        type: "rating",
        question: "How would you describe your resilience and adaptability when facing challenges or changes?",
        description:
          "Your ability to adapt to change and recover from setbacks.",
        scaleLabels: [
          "Very low",
          "Low",
          "Moderate",
          "Good",
          "Very good"
        ]
      },

      {
        key: "Skill_Leadership",
        type: "rating",
        question: "How would you describe your leadership and social influence?",
        description:
          "Your confidence in guiding and motivating others.",
        scaleLabels: [
          "Very low",
          "Low",
          "Moderate",
          "Good",
          "Very good"
        ]
      },

      {
        key: "Skill_Creative",
        type: "rating",
        question: "How would you rate your creative thinking?",
        description:
          "Your ability to generate new and original ideas.",
        scaleLabels: [
          "Very low",
          "Low",
          "Moderate",
          "Good",
          "Very good"
        ]
      },

      {
        key: "Skill_Motivation",
        type: "rating",
        question: "How would you rate your motivation and self-awareness?",
        description:
          "Your ability to stay driven and understand your strengths and weaknesses.",
        scaleLabels: [
          "Very low",
          "Low",
          "Moderate",
          "Good",
          "Very good"
        ]
      },

      {
        key: "Skill_Tech_Literacy",
        type: "rating",
        question: "How comfortable are you with technology and digital tools?",
        description:
          "Your confidence in using digital tools and learning new technologies.",
        scaleLabels: [
          "Very low",
          "Low",
          "Moderate",
          "Good",
          "Very good"
        ]
      },

      {
        key: "Skill_Empathy",
        type: "rating",
        question: "How strong are your empathy and active listening skills?",
        description:
          "Your ability to understand others and listen carefully.",
        scaleLabels: [
          "Very low",
          "Low",
          "Moderate",
          "Good",
          "Very good"
        ]
      },

      {
        key: "Skill_Curiosity",
        type: "rating",
        question: "Finally, how would you rate your curiosity and willingness to continuously learn?",
        description:
          "How actively you seek knowledge and learn beyond required work.",
        scaleLabels: [
          "Very low",
          "Low",
          "Moderate",
          "Good",
          "Very good"
        ]
      },

          ]
  },

  si: {
    welcome:
      "👋 රැකියා හැකියාව AI සහායකයා වෙත සාදරයෙන් පිළිගනිමු",

    intro:
      "ඔබගේ රැකියා හැකියාව විශ්ලේෂණය කිරීමට මම ඔබෙන් ප්‍රශ්න කිහිපයක් අසමි.",

    start:
      "ආරම්භ කරන්න",

    finish:
      "මගේ රැකියා හැකියාව විශ්ලේෂණය කරන්න"
  },

  ta: {
    welcome:
      "👋 வேலைவாய்ப்பு AI உதவியாளருக்கு வரவேற்கிறோம்",

    intro:
      "உங்கள் வேலைவாய்ப்பு திறனை பகுப்பாய்வு செய்ய சில கேள்விகள் கேட்கிறேன்.",

    start:
      "தொடங்கவும்",

    finish:
      "என் வேலைவாய்ப்பு மதிப்பீட்டை பகுப்பாய்வு செய்"
  }
};
