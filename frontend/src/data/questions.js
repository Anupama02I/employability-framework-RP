// frontend/src/data/questions.js


// ============================================================
// CONSTANTS
// ============================================================

// Used when formal_training = "No".
// This MUST match the backend/model training value exactly.
export const NO_TRAINING_VALUE =
  "NOT_APPLICABLE_NO_FORMAL_TRAINING";


// ============================================================
// HELPERS
// ============================================================

const createOption = (value, label) => ({
  value,
  label,
});


// Age range used by the research
const AGE_OPTIONS = Array.from(
  { length: 15 },
  (_, index) => {
    const age = index + 15;

    return {
      value: age,
      label: String(age),
    };
  }
);

// ============================================================
// HOUSEHOLD SIZE OPTIONS
//
// The original survey uses:
// 1, 2, 3, 4, 5, 6, 7 or more
//
// The model receives an integer.
// "7 or more" is represented internally as 7.
// ============================================================

const HOUSEHOLD_SIZE_OPTIONS = {

  en: [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
    { value: 6, label: "6" },
    { value: 7, label: "7 or more" },
  ],

  si: [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
    { value: 6, label: "6" },
    { value: 7, label: "7 හෝ ඊට වැඩි" },
  ],

  ta: [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
    { value: 6, label: "6" },
    { value: 7, label: "7 அல்லது அதற்கு மேல்" },
  ],
};


// ============================================================
// EXACT CANONICAL CATEGORIES
//
// IMPORTANT:
//
// These are the values that are sent to FastAPI.
//
// DO NOT translate these values.
//
// Sinhala / Tamil / English translations are only
// DISPLAY LABELS.
//
// Example:
//
// User sees:
//     උතුරු මැද
//
// Model receives:
//     North Central
// ============================================================

export const CANONICAL_OPTIONS = {

  gender: [
    "Female",
    "Male",
  ],

  marital_status: [
    "Never married",
    "Married",
    "Divorced / Separated",
    "Widowed",
    "Prefer not to say",
  ],

  education_level: [
    "GCE O-Level",
    "GCE A-Level",
    "Certificate / Vocational Training",
    "Diploma / HND",
    "Bachelor's Degree",
    "Postgraduate Qualification",
  ],

  field_of_study: [
    "General Education / No specialization",
    "Arts / Humanities / Social Sciences",
    "Business / Commerce / Management",
    "Engineering / Technology",
    "IT / Computer Science",
    "Science / Mathematics",
    "Vocational Trades",
  ],

  time_since_studies: [
    "Not completed yet",
    "Less than 6 months",
    "6-12 months",
    "More than 12 months",
  ],

  province: [
    "Western",
    "Central",
    "Southern",
    "Northern",
    "Eastern",
    "North Western",
    "North Central",
    "Uva",
    "Sabaragamuwa",
  ],

  digital_access: [
    "No access / Very unreliable",
    "Limited access",
    "Average",
    "Good",
    "Excellent",
  ],

  formal_training: [
    "Yes",
    "No",
  ],

  training_type: [
    "Apprenticeship / Technical training",
    "Certificate course",
    "Diploma",
    "Higher Diploma",
    "NVQ",
    "Other",
    "Professional qualification",
  ],

  training_field: [
    "Agriculture",
    "Automobile / Mechanical",
    "Beauty / Personal Care",
    "Business / Management",
    "Construction",
    "Healthcare",
    "Hospitality / Tourism",
    "Information Technology",
    "Other",
  ],

  training_duration: [
    "Less than 3 months",
    "3-6 months",
    "6-12 months",
    "More than 1 year",
  ],

  training_relevance: [
    "Not relevant",
    "Slightly relevant",
    "Moderately relevant",
    "Very relevant",
    "Highly relevant",
  ],
};


// ============================================================
// DISPLAY VALUE TRANSLATIONS
//
// The object key is always the canonical model value.
// ============================================================

const VALUE_LABELS = {

  // ==========================================================
  // ENGLISH
  // ==========================================================

  en: {

    // Gender
    Female: "Female",
    Male: "Male",

    // Marital status
    "Never married": "Never married",
    Married: "Married",
    "Divorced / Separated": "Divorced / Separated",
    Widowed: "Widowed",
    "Prefer not to say": "Prefer not to say",

    // Education
    "GCE O-Level": "GCE O-Level",
    "GCE A-Level": "GCE A-Level",

    "Certificate / Vocational Training":
      "Certificate / Vocational Training",

    "Diploma / HND":
      "Diploma / HND",

    "Bachelor's Degree":
      "Bachelor's Degree",

    "Postgraduate Qualification":
      "Postgraduate Qualification",

    // Field of study
    "General Education / No specialization":
      "General Education / No specialization",

    "Arts / Humanities / Social Sciences":
      "Arts / Humanities / Social Sciences",

    "Business / Commerce / Management":
      "Business / Commerce / Management",

    "Engineering / Technology":
      "Engineering / Technology",

    "IT / Computer Science":
      "IT / Computer Science",

    "Science / Mathematics":
      "Science / Mathematics",

    "Vocational Trades":
      "Vocational Trades",

    // Time since studies
    "Not completed yet":
      "I am still studying",

    "Less than 6 months":
      "Less than 6 months",

    "6-12 months":
      "6–12 months",

    "More than 12 months":
      "More than 12 months",

    // Provinces
    Western: "Western",
    Central: "Central",
    Southern: "Southern",
    Northern: "Northern",
    Eastern: "Eastern",

    "North Western":
      "North Western",

    "North Central":
      "North Central",

    Uva: "Uva",
    Sabaragamuwa: "Sabaragamuwa",

    // Digital access
    "No access / Very unreliable":
      "No access / Very unreliable",

    "Limited access":
      "Limited access",

    Average:
      "Average",

    Good:
      "Good",

    Excellent:
      "Excellent",

    // Yes / No
    Yes: "Yes",
    No: "No",

    // Training type
    "Apprenticeship / Technical training":
      "Apprenticeship / Technical training",

    "Certificate course":
      "Certificate course",

    Diploma:
      "Diploma",

    "Higher Diploma":
      "Higher Diploma",

    NVQ:
      "NVQ",

    Other:
      "Other",

    "Professional qualification":
      "Professional qualification",

    // Training field
    Agriculture:
      "Agriculture",

    "Automobile / Mechanical":
      "Automobile / Mechanical",

    "Beauty / Personal Care":
      "Beauty / Personal Care",

    "Business / Management":
      "Business / Management",

    Construction:
      "Construction",

    Healthcare:
      "Healthcare",

    "Hospitality / Tourism":
      "Hospitality / Tourism",

    "Information Technology":
      "Information Technology",

    // Training duration
    "Less than 3 months":
      "Less than 3 months",

    "3-6 months":
      "3–6 months",

    "More than 1 year":
      "More than 1 year",

    // Relevance
    "Not relevant":
      "Not relevant",

    "Slightly relevant":
      "Slightly relevant",

    "Moderately relevant":
      "Moderately relevant",

    "Very relevant":
      "Very relevant",

    "Highly relevant":
      "Highly relevant",

    [NO_TRAINING_VALUE]:
      "Not applicable",
  },


  // ==========================================================
  // SINHALA
  // ==========================================================

  si: {

    Female:
      "ගැහැණු",

    Male:
      "පිරිමි",

    "Never married":
      "කිසිදා විවාහ වී නැත",

    Married:
      "විවාහක",

    "Divorced / Separated":
      "දික්කසාද වූ / වෙන්වී සිටින",

    Widowed:
      "වැන්දඹු",

    "Prefer not to say":
      "පිළිතුරු දීමට අකමැතියි",

    "GCE O-Level":
      "අ.පො.ස. සාමාන්‍ය පෙළ",

    "GCE A-Level":
      "අ.පො.ස. උසස් පෙළ",

    "Certificate / Vocational Training":
      "සහතික / වෘත්තීය පුහුණුව",

    "Diploma / HND":
      "ඩිප්ලෝමා / HND",

    "Bachelor's Degree":
      "උපාධිය",

    "Postgraduate Qualification":
      "පශ්චාත් උපාධි සුදුසුකම",

    "General Education / No specialization":
      "සාමාන්‍ය අධ්‍යාපනය / විශේෂීකරණයක් නැත",

    "Arts / Humanities / Social Sciences":
      "කලා / මානව ශාස්ත්‍ර / සමාජ විද්‍යා",

    "Business / Commerce / Management":
      "ව්‍යාපාර / වාණිජ / කළමනාකරණ",

    "Engineering / Technology":
      "ඉංජිනේරු / තාක්ෂණ",

    "IT / Computer Science":
      "තොරතුරු තාක්ෂණ / පරිගණක විද්‍යාව",

    "Science / Mathematics":
      "විද්‍යා / ගණිත",

    "Vocational Trades":
      "වෘත්තීය ක්ෂේත්‍ර",

    "Not completed yet":
      "තවම අධ්‍යයනය කරමින් සිටිමි",

    "Less than 6 months":
      "මාස 6කට අඩු",

    "6-12 months":
      "මාස 6–12",

    "More than 12 months":
      "මාස 12කට වැඩි",

    Western:
      "බස්නාහිර",

    Central:
      "මධ්‍යම",

    Southern:
      "දකුණු",

    Northern:
      "උතුරු",

    Eastern:
      "නැගෙනහිර",

    "North Western":
      "වයඹ",

    "North Central":
      "උතුරු මැද",

    Uva:
      "ඌව",

    Sabaragamuwa:
      "සබරගමුව",

    "No access / Very unreliable":
      "ප්‍රවේශයක් නැත / ඉතා අවිශ්වාසදායක",

    "Limited access":
      "සීමිත ප්‍රවේශය",

    Average:
      "සාමාන්‍ය",

    Good:
      "හොඳ",

    Excellent:
      "විශිෂ්ට",

    Yes:
      "ඔව්",

    No:
      "නැහැ",

    "Apprenticeship / Technical training":
      "ආධුනිකත්ව / තාක්ෂණික පුහුණුව",

    "Certificate course":
      "සහතික පාඨමාලාව",

    Diploma:
      "ඩිප්ලෝමා",

    "Higher Diploma":
      "උසස් ඩිප්ලෝමා",

    NVQ:
      "NVQ",

    Other:
      "වෙනත්",

    "Professional qualification":
      "වෘත්තීය සුදුසුකම",

    Agriculture:
      "කෘෂිකර්ම",

    "Automobile / Mechanical":
      "මෝටර් රථ / යාන්ත්‍රික",

    "Beauty / Personal Care":
      "රූපලාවණ්‍ය / පුද්ගලික සත්කාර",

    "Business / Management":
      "ව්‍යාපාර / කළමනාකරණ",

    Construction:
      "ඉදිකිරීම්",

    Healthcare:
      "සෞඛ්‍ය සේවා",

    "Hospitality / Tourism":
      "ආගන්තුක සත්කාර / සංචාරක",

    "Information Technology":
      "තොරතුරු තාක්ෂණ",

    "Less than 3 months":
      "මාස 3කට අඩු",

    "3-6 months":
      "මාස 3–6",

    "More than 1 year":
      "වසර 1කට වැඩි",

    "Not relevant":
      "අදාළ නොවේ",

    "Slightly relevant":
      "සුළු වශයෙන් අදාළ",

    "Moderately relevant":
      "මධ්‍යස්ථව අදාළ",

    "Very relevant":
      "ඉතා අදාළ",

    "Highly relevant":
      "අතිශයින් අදාළ",

    [NO_TRAINING_VALUE]:
      "අදාළ නොවේ",
  },


  // ==========================================================
  // TAMIL
  // ==========================================================

  ta: {

    Female:
      "பெண்",

    Male:
      "ஆண்",

    "Never married":
      "திருமணம் ஆகாதவர்",

    Married:
      "திருமணமானவர்",

    "Divorced / Separated":
      "விவாகரத்து / பிரிந்து வாழ்பவர்",

    Widowed:
      "விதவை / விதவர்",

    "Prefer not to say":
      "பதிலளிக்க விரும்பவில்லை",

    "GCE O-Level":
      "GCE சாதாரண தரம்",

    "GCE A-Level":
      "GCE உயர்தரம்",

    "Certificate / Vocational Training":
      "சான்றிதழ் / தொழிற்பயிற்சி",

    "Diploma / HND":
      "டிப்ளோமா / HND",

    "Bachelor's Degree":
      "இளங்கலைப் பட்டம்",

    "Postgraduate Qualification":
      "முதுகலைத் தகுதி",

    "General Education / No specialization":
      "பொதுக் கல்வி / சிறப்புத் துறை இல்லை",

    "Arts / Humanities / Social Sciences":
      "கலை / மனிதவியல் / சமூக அறிவியல்",

    "Business / Commerce / Management":
      "வணிகம் / வர்த்தகம் / மேலாண்மை",

    "Engineering / Technology":
      "பொறியியல் / தொழில்நுட்பம்",

    "IT / Computer Science":
      "தகவல் தொழில்நுட்பம் / கணினி அறிவியல்",

    "Science / Mathematics":
      "அறிவியல் / கணிதம்",

    "Vocational Trades":
      "தொழில்சார் துறைகள்",

    "Not completed yet":
      "இன்னும் படித்து வருகிறேன்",

    "Less than 6 months":
      "6 மாதங்களுக்கு குறைவாக",

    "6-12 months":
      "6–12 மாதங்கள்",

    "More than 12 months":
      "12 மாதங்களுக்கு மேல்",

    Western:
      "மேற்கு",

    Central:
      "மத்திய",

    Southern:
      "தெற்கு",

    Northern:
      "வடக்கு",

    Eastern:
      "கிழக்கு",

    "North Western":
      "வடமேற்கு",

    "North Central":
      "வடமத்திய",

    Uva:
      "ஊவா",

    Sabaragamuwa:
      "சபரகமுவ",

    "No access / Very unreliable":
      "அணுகல் இல்லை / மிகவும் நம்பகமற்றது",

    "Limited access":
      "வரையறுக்கப்பட்ட அணுகல்",

    Average:
      "சராசரி",

    Good:
      "நன்று",

    Excellent:
      "மிகச் சிறந்தது",

    Yes:
      "ஆம்",

    No:
      "இல்லை",

    "Apprenticeship / Technical training":
      "பயிற்சியாளர் / தொழில்நுட்ப பயிற்சி",

    "Certificate course":
      "சான்றிதழ் பாடநெறி",

    Diploma:
      "டிப்ளோமா",

    "Higher Diploma":
      "உயர் டிப்ளோமா",

    NVQ:
      "NVQ",

    Other:
      "மற்றவை",

    "Professional qualification":
      "தொழில்முறை தகுதி",

    Agriculture:
      "விவசாயம்",

    "Automobile / Mechanical":
      "வாகன / இயந்திரவியல்",

    "Beauty / Personal Care":
      "அழகு / தனிப்பட்ட பராமரிப்பு",

    "Business / Management":
      "வணிகம் / மேலாண்மை",

    Construction:
      "கட்டுமானம்",

    Healthcare:
      "சுகாதாரம்",

    "Hospitality / Tourism":
      "விருந்தோம்பல் / சுற்றுலா",

    "Information Technology":
      "தகவல் தொழில்நுட்பம்",

    "Less than 3 months":
      "3 மாதங்களுக்கு குறைவாக",

    "3-6 months":
      "3–6 மாதங்கள்",

    "More than 1 year":
      "1 ஆண்டிற்கு மேல்",

    "Not relevant":
      "தொடர்பில்லை",

    "Slightly relevant":
      "சிறிதளவு தொடர்புடையது",

    "Moderately relevant":
      "மிதமான தொடர்புடையது",

    "Very relevant":
      "மிகவும் தொடர்புடையது",

    "Highly relevant":
      "மிக அதிகமாக தொடர்புடையது",

    [NO_TRAINING_VALUE]:
      "பொருந்தாது",
  },
};


// ============================================================
// SHAP FEATURE LABELS
//
// Backend returns:
//
// {
//   feature_key: "analytical_thinking",
//   value: 3
// }
//
// Frontend uses these labels for display.
// ============================================================

const FEATURE_LABELS = {

  en: {

    analytical_thinking:
      "Analytical thinking",

    resilience_flexibility_agility:
      "Resilience, flexibility and agility",

    leadership_social_influence:
      "Leadership and social influence",

    creative_thinking:
      "Creative thinking",

    motivation_self_awareness:
      "Motivation and self-awareness",

    technological_literacy:
      "Technological literacy",

    empathy_active_listening:
      "Empathy and active listening",

    curiosity_lifelong_learning:
      "Curiosity and lifelong learning",

    talent_management:
      "Talent management",

    service_orientation:
      "Service orientation",

    age:
      "Age",

    gender:
      "Gender",

    marital_status:
      "Marital status",

    household_size:
      "Household size",

    education_level:
      "Education level",

    field_of_study:
      "Field of study",

    time_since_studies:
      "Time since studies",

    province:
      "Province",

    digital_access:
      "Digital access",

    english_communication:
      "English communication",

    digital_confidence:
      "Digital confidence",

    formal_training:
      "Formal training",

    training_type:
      "Training type",

    training_field:
      "Training field",

    training_duration:
      "Training duration",

    training_relevance:
      "Training relevance",
  },


  si: {

    analytical_thinking:
      "විශ්ලේෂණාත්මක චින්තනය",

    resilience_flexibility_agility:
      "ඔරොත්තු දීමේ හැකියාව, නම්‍යශීලීභාවය සහ අනුවර්තනය",

    leadership_social_influence:
      "නායකත්වය සහ සමාජ බලපෑම",

    creative_thinking:
      "නිර්මාණශීලී චින්තනය",

    motivation_self_awareness:
      "අභිප්‍රේරණය සහ ස්වයං අවබෝධය",

    technological_literacy:
      "තාක්ෂණික සාක්ෂරතාව",

    empathy_active_listening:
      "සහකම්පනය සහ සක්‍රීය සවන්දීම",

    curiosity_lifelong_learning:
      "කුතුහලය සහ ජීවිත කාලීන ඉගෙනීම",

    talent_management:
      "කුසලතා කළමනාකරණය",

    service_orientation:
      "සේවා නැඹුරුව",

    age:
      "වයස",

    gender:
      "ස්ත්‍රී පුරුෂ භාවය",

    marital_status:
      "විවාහක තත්ත්වය",

    household_size:
      "ගෘහස්ථ සාමාජික සංඛ්‍යාව",

    education_level:
      "අධ්‍යාපන මට්ටම",

    field_of_study:
      "අධ්‍යයන ක්ෂේත්‍රය",

    time_since_studies:
      "අධ්‍යයනයෙන් පසු ගත වූ කාලය",

    province:
      "පළාත",

    digital_access:
      "ඩිජිටල් ප්‍රවේශය",

    english_communication:
      "ඉංග්‍රීසි සන්නිවේදන හැකියාව",

    digital_confidence:
      "ඩිජිටල් විශ්වාසය",

    formal_training:
      "විධිමත් පුහුණුව",

    training_type:
      "පුහුණු වර්ගය",

    training_field:
      "පුහුණු ක්ෂේත්‍රය",

    training_duration:
      "පුහුණු කාලසීමාව",

    training_relevance:
      "පුහුණුවේ අදාළත්වය",
  },


  ta: {

    analytical_thinking:
      "பகுப்பாய்வு சிந்தனை",

    resilience_flexibility_agility:
      "மீட்சித்திறன், நெகிழ்வுத்தன்மை மற்றும் தழுவல்",

    leadership_social_influence:
      "தலைமைத்துவம் மற்றும் சமூக செல்வாக்கு",

    creative_thinking:
      "படைப்பாற்றல் சிந்தனை",

    motivation_self_awareness:
      "உந்துதல் மற்றும் சுய விழிப்புணர்வு",

    technological_literacy:
      "தொழில்நுட்ப அறிவு",

    empathy_active_listening:
      "பரிவு மற்றும் செயலில் கேட்பது",

    curiosity_lifelong_learning:
      "ஆர்வம் மற்றும் வாழ்நாள் கற்றல்",

    talent_management:
      "திறமை மேலாண்மை",

    service_orientation:
      "சேவை நோக்கு",

    age:
      "வயது",

    gender:
      "பாலினம்",

    marital_status:
      "திருமண நிலை",

    household_size:
      "குடும்ப உறுப்பினர்களின் எண்ணிக்கை",

    education_level:
      "கல்வி நிலை",

    field_of_study:
      "படிப்பு துறை",

    time_since_studies:
      "படிப்புக்குப் பிறகு கடந்த காலம்",

    province:
      "மாகாணம்",

    digital_access:
      "டிஜிட்டல் அணுகல்",

    english_communication:
      "ஆங்கில தொடர்புத்திறன்",

    digital_confidence:
      "டிஜிட்டல் நம்பிக்கை",

    formal_training:
      "முறையான பயிற்சி",

    training_type:
      "பயிற்சி வகை",

    training_field:
      "பயிற்சி துறை",

    training_duration:
      "பயிற்சி காலம்",

    training_relevance:
      "பயிற்சியின் தொடர்புடைய தன்மை",
  },
};


// ============================================================
// RATING SCALE
// ============================================================

const RATING_LABELS = {

  en: [
    "Very low",
    "Low",
    "Moderate",
    "Good",
    "Very good",
  ],

  si: [
    "ඉතා අඩු",
    "අඩු",
    "මධ්‍යම",
    "හොඳ",
    "ඉතා හොඳ",
  ],

  ta: [
    "மிகக் குறைவு",
    "குறைவு",
    "மிதமான",
    "நன்று",
    "மிக நன்று",
  ],
};


// ============================================================
// QUESTION TEXT + SHORT EXPLANATIONS
// ============================================================

const QUESTION_TEXT = {

  // ==========================================================
  // ENGLISH
  // ==========================================================

  en: {

    age: {
      question:
        "To begin, may I know your age?",
    },

    gender: {
      question:
        "Thanks! What is your gender?",
    },

    marital_status: {
      question:
        "What is your current marital status?",
    },

    household_size: {
      question:
        "Including yourself, how many people normally live in your household?",

      description:
        "Enter the total number of people who usually live in your household.",
    },

    education_level: {
      question:
        "What is the highest level of education you have completed?",
    },

    field_of_study: {
      question:
        "Which field best describes your main area of study?",
    },

    time_since_studies: {
      question:
        "How long has it been since you completed your most recent studies?",
    },

    province: {
      question:
        "Which province do you currently live in?",
    },

    digital_access: {
      question:
        "How would you describe your access to digital devices and the internet?",
    },

    english_communication: {
      question:
        "How would you rate your ability to communicate in English?",

      description:
        "Think about how comfortable you are understanding, speaking, and communicating in English.",
    },

    digital_confidence: {
      question:
        "How confident are you when using digital tools and technology?",

      description:
        "Think about using phones, computers, online platforms, apps, and learning new digital tools.",
    },

    formal_training: {
      question:
        "Have you completed any formal vocational, professional, or job-related training?",
    },

    training_type: {
      question:
        "What type of formal training did you complete?",
    },

    training_field: {
      question:
        "What was the main field of your training?",
    },

    training_duration: {
      question:
        "How long was the training programme?",
    },

    training_relevance: {
      question:
        "How relevant was that training to the type of work you want to do?",
    },


    // ========================================================
    // 10 SKILLS
    // ========================================================

    analytical_thinking: {

      question:
        "Let’s talk about your skills. How would you rate your analytical thinking?",

      description:
        "Think about how well you understand a problem, look at the available information, and work out a sensible solution.",
    },


    resilience_flexibility_agility: {

      question:
        "How would you rate your resilience, flexibility, and ability to adapt?",

      description:
        "Think about how well you adjust when plans change, handle difficulties, and continue moving forward after setbacks.",
    },


    leadership_social_influence: {

      question:
        "How would you rate your leadership and social influence?",

      description:
        "Think about how comfortable you are guiding others, sharing ideas, encouraging people, or positively influencing a group.",
    },


    creative_thinking: {

      question:
        "How would you rate your creative thinking?",

      description:
        "Think about how easily you come up with new ideas or find different ways to solve a problem.",
    },


    motivation_self_awareness: {

      question:
        "How would you rate your motivation and self-awareness?",

      description:
        "Think about how well you understand your strengths and areas to improve, while keeping yourself motivated toward your goals.",
    },


    technological_literacy: {

      question:
        "How would you rate your technological literacy?",

      description:
        "Think about how comfortable you are using technology, digital tools, and learning to use new systems or applications.",
    },


    empathy_active_listening: {

      question:
        "How would you rate your empathy and active listening?",

      description:
        "Think about how well you listen to others, understand their point of view, and respond with consideration.",
    },


    curiosity_lifelong_learning: {

      question:
        "How would you rate your curiosity and willingness to keep learning?",

      description:
        "Think about how interested you are in learning new things, asking questions, and improving your knowledge or skills over time.",
    },


    talent_management: {

      question:
        "How would you rate your talent management skills?",

      description:
        "Think about how well you recognize people's strengths, including your own, and help use or develop those abilities effectively.",
    },


    service_orientation: {

      question:
        "How would you rate your service orientation?",

      description:
        "Think about how willing and able you are to understand people's needs and provide helpful, respectful, and effective support.",
    },
  },


  // ==========================================================
  // SINHALA
  // ==========================================================

  si: {

    age: {
      question:
        "පළමුව, ඔබගේ වයස කීයද?",
    },

    gender: {
      question:
        "ස්තූතියි. ඔබගේ ස්ත්‍රී පුරුෂ භාවය කුමක්ද?",
    },

    marital_status: {
      question:
        "ඔබගේ වර්තමාන විවාහක තත්ත්වය කුමක්ද?",
    },

    household_size: {

      question:
        "ඔබ ඇතුළුව, ඔබගේ ගෘහස්ථයේ සාමාන්‍යයෙන් ජීවත් වන පුද්ගලයින් සංඛ්‍යාව කීයද?",

      description:
        "ඔබගේ නිවසේ සාමාන්‍යයෙන් ජීවත් වන මුළු පුද්ගලයින් සංඛ්‍යාව ලබා දෙන්න.",
    },

    education_level: {
      question:
        "ඔබ සම්පූර්ණ කර ඇති ඉහළම අධ්‍යාපන මට්ටම කුමක්ද?",
    },

    field_of_study: {
      question:
        "ඔබගේ ප්‍රධාන අධ්‍යයන ක්ෂේත්‍රය වඩාත් හොඳින් විස්තර කරන්නේ කුමක්ද?",
    },

    time_since_studies: {
      question:
        "ඔබගේ ඉහළම අධ්‍යාපන මට්ටම සම්පූර්ණ කර කොපමණ කාලයක් ගතවී තිබේද?",
    },

    province: {
      question:
        "ඔබ දැනට ජීවත් වන පළාත කුමක්ද?",
    },

    digital_access: {
      question:
        "ඩිජිටල් උපකරණ සහ අන්තර්ජාලය වෙත ඔබගේ ප්‍රවේශය කෙසේද?",
    },

    english_communication: {

      question:
        "ඉංග්‍රීසි භාෂාවෙන් සන්නිවේදනය කිරීමේ ඔබගේ හැකියාව කෙසේ ඇගයීමට ලක් කරන්නේද?",

      description:
        "ඉංග්‍රීසි තේරුම් ගැනීම, කතා කිරීම සහ අන් අය සමඟ සන්නිවේදනය කිරීමේදී ඔබට ඇති පහසුව සලකා බලන්න.",
    },

    digital_confidence: {

      question:
        "ඩිජිටල් මෙවලම් සහ තාක්ෂණය භාවිතා කිරීමේදී ඔබගේ විශ්වාසය කෙසේද?",

      description:
        "දුරකථන, පරිගණක, යෙදුම්, මාර්ගගත සේවා සහ නව ඩිජිටල් මෙවලම් භාවිතා කිරීම ගැන සිතන්න.",
    },

    formal_training: {
      question:
        "ඔබ විධිමත් වෘත්තීය, වෘත්තීමය හෝ රැකියා සම්බන්ධ පුහුණුවක් සම්පූර්ණ කර තිබේද?",
    },

    training_type: {
      question:
        "ඔබ සම්පූර්ණ කළ පුහුණුවේ වර්ගය කුමක්ද?",
    },

    training_field: {
      question:
        "ඔබගේ පුහුණුවේ ප්‍රධාන ක්ෂේත්‍රය කුමක්ද?",
    },

    training_duration: {
      question:
        "එම පුහුණුවේ කාලසීමාව කොපමණද?",
    },

    training_relevance: {
      question:
        "ඔබ කිරීමට කැමති රැකියා වර්ගයට එම පුහුණුව කෙතරම් අදාළද?",
    },


    // ========================================================
    // 10 SKILLS
    // ========================================================

    analytical_thinking: {

      question:
        "දැන් ඔබගේ කුසලතා ගැන කතා කරමු. ඔබගේ විශ්ලේෂණාත්මක චින්තන හැකියාව කෙසේද?",

      description:
        "ගැටලුවක් හොඳින් තේරුම්ගෙන, තිබෙන තොරතුරු සලකා බලා සුදුසු විසඳුමක් සොයාගැනීමට ඔබට ඇති හැකියාව ගැන සිතන්න.",
    },


    resilience_flexibility_agility: {

      question:
        "ඔබගේ ඔරොත්තු දීමේ, නම්‍යශීලී සහ වෙනස්කම්වලට අනුවර්තනය වීමේ හැකියාව කෙසේද?",

      description:
        "සැලසුම් වෙනස් වූ විට හැඩගැසීම, අභියෝග සමඟ කටයුතු කිරීම සහ පසුබෑම්වලින් පසු නැවත ඉදිරියට යාම ගැන සිතන්න.",
    },


    leadership_social_influence: {

      question:
        "ඔබගේ නායකත්ව සහ සමාජ බලපෑම් හැකියාව කෙසේද?",

      description:
        "අන් අයට මඟ පෙන්වීම, අදහස් බෙදා ගැනීම, උනන්දු කිරීම හෝ කණ්ඩායමකට ධනාත්මක බලපෑමක් කිරීම ගැන සිතන්න.",
    },


    creative_thinking: {

      question:
        "ඔබගේ නිර්මාණශීලී චින්තන හැකියාව කෙසේද?",

      description:
        "නව අදහස් ඉදිරිපත් කිරීම හෝ ගැටලුවකට වෙනස් ආකාරයේ විසඳුම් සොයාගැනීම ඔබට කෙතරම් පහසුද යන්න ගැන සිතන්න.",
    },


    motivation_self_awareness: {

      question:
        "ඔබගේ අභිප්‍රේරණය සහ ස්වයං අවබෝධය කෙසේද?",

      description:
        "ඔබගේ ශක්ති සහ වැඩිදියුණු කළ යුතු පැති හඳුනාගෙන, ඔබගේ ඉලක්ක කරා යාමට ඔබවම උනන්දු කරගැනීම ගැන සිතන්න.",
    },


    technological_literacy: {

      question:
        "ඔබගේ තාක්ෂණික සාක්ෂරතාව කෙසේද?",

      description:
        "තාක්ෂණික උපකරණ සහ ඩිජිටල් මෙවලම් භාවිතා කිරීමත්, නව යෙදුම් හෝ පද්ධති ඉගෙන ගැනීමත් ගැන ඔබට ඇති පහසුව සලකා බලන්න.",
    },


    empathy_active_listening: {

      question:
        "ඔබගේ සහකම්පන සහ සක්‍රීය සවන්දීමේ හැකියාව කෙසේද?",

      description:
        "අන් අය කියන දේ අවධානයෙන් ඇසීම, ඔවුන්ගේ දෘෂ්ටිකෝණය තේරුම් ගැනීම සහ සැලකිල්ලෙන් ප්‍රතිචාර දැක්වීම ගැන සිතන්න.",
    },


    curiosity_lifelong_learning: {

      question:
        "ඔබගේ කුතුහලය සහ අඛණ්ඩව ඉගෙනීමට ඇති කැමැත්ත කෙසේද?",

      description:
        "නව දේවල් ඉගෙනීමට, ප්‍රශ්න අසීමට සහ කාලයත් සමඟ ඔබගේ දැනුම හා කුසලතා වැඩිදියුණු කිරීමට ඇති උනන්දුව ගැන සිතන්න.",
    },


    talent_management: {

      question:
        "ඔබගේ කුසලතා කළමනාකරණ හැකියාව කෙසේද?",

      description:
        "ඔබගේ හෝ අන් අයගේ ශක්ති හඳුනාගෙන, ඒවා හොඳින් භාවිතා කිරීමට හෝ වැඩිදියුණු කිරීමට ඇති හැකියාව ගැන සිතන්න.",
    },


    service_orientation: {

      question:
        "ඔබගේ සේවා නැඹුරුව කෙසේද?",

      description:
        "අන් අයගේ අවශ්‍යතා තේරුම්ගෙන, ගෞරවයෙන් සහ ප්‍රයෝජනවත් ආකාරයෙන් උපකාර කිරීමට ඔබට ඇති කැමැත්ත සහ හැකියාව ගැන සිතන්න.",
    },
  },


  // ==========================================================
  // TAMIL
  // ==========================================================

  ta: {

    age: {
      question:
        "தொடங்குவதற்கு, உங்கள் வயது என்ன?",
    },

    gender: {
      question:
        "நன்றி. உங்கள் பாலினம் என்ன?",
    },

    marital_status: {
      question:
        "உங்கள் தற்போதைய திருமண நிலை என்ன?",
    },

    household_size: {

      question:
        "உங்களைச் சேர்த்து உங்கள் வீட்டில் வழக்கமாக எத்தனை பேர் வசிக்கிறார்கள்?",

      description:
        "உங்கள் வீட்டில் பொதுவாக வசிக்கும் மொத்த நபர்களின் எண்ணிக்கையை உள்ளிடவும்.",
    },

    education_level: {
      question:
        "நீங்கள் முடித்துள்ள உயர்ந்த கல்வி நிலை என்ன?",
    },

    field_of_study: {
      question:
        "உங்கள் முக்கிய படிப்பு துறையை சிறப்பாக விவரிப்பது எது?",
    },

    time_since_studies: {
      question:
        "உங்கள் சமீபத்திய படிப்பை முடித்து எவ்வளவு காலம் ஆகிறது?",
    },

    province: {
      question:
        "நீங்கள் தற்போது எந்த மாகாணத்தில் வசிக்கிறீர்கள்?",
    },

    digital_access: {
      question:
        "டிஜிட்டல் சாதனங்கள் மற்றும் இணையத்திற்கான உங்கள் அணுகலை எவ்வாறு விவரிப்பீர்கள்?",
    },

    english_communication: {

      question:
        "ஆங்கிலத்தில் தொடர்பு கொள்ளும் உங்கள் திறனை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "ஆங்கிலத்தைப் புரிந்துகொள்வது, பேசுவது மற்றும் மற்றவர்களுடன் தொடர்பு கொள்வதில் நீங்கள் எவ்வளவு வசதியாக உள்ளீர்கள் என்பதை நினைத்துப் பாருங்கள்.",
    },

    digital_confidence: {

      question:
        "டிஜிட்டல் கருவிகள் மற்றும் தொழில்நுட்பத்தைப் பயன்படுத்துவதில் நீங்கள் எவ்வளவு நம்பிக்கையுடன் உள்ளீர்கள்?",

      description:
        "தொலைபேசி, கணினி, செயலிகள், இணைய சேவைகள் மற்றும் புதிய டிஜிட்டல் கருவிகளைப் பயன்படுத்துவது பற்றி நினைத்துப் பாருங்கள்.",
    },

    formal_training: {
      question:
        "நீங்கள் முறையான தொழிற்பயிற்சி, தொழில்முறை அல்லது வேலை தொடர்பான பயிற்சியை முடித்துள்ளீர்களா?",
    },

    training_type: {
      question:
        "நீங்கள் முடித்த பயிற்சியின் வகை என்ன?",
    },

    training_field: {
      question:
        "உங்கள் பயிற்சியின் முக்கிய துறை என்ன?",
    },

    training_duration: {
      question:
        "அந்த பயிற்சியின் கால அளவு என்ன?",
    },

    training_relevance: {
      question:
        "நீங்கள் செய்ய விரும்பும் வேலைக்கு அந்த பயிற்சி எவ்வளவு தொடர்புடையது?",
    },


    // ========================================================
    // 10 SKILLS
    // ========================================================

    analytical_thinking: {

      question:
        "இப்போது உங்கள் திறன்களைப் பார்ப்போம். உங்கள் பகுப்பாய்வு சிந்தனை திறனை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "ஒரு பிரச்சினையைப் புரிந்துகொண்டு, கிடைக்கும் தகவல்களைப் பார்த்து, பொருத்தமான தீர்வை கண்டறியும் உங்கள் திறனை நினைத்துப் பாருங்கள்.",
    },


    resilience_flexibility_agility: {

      question:
        "மாற்றங்களுக்கு தழுவிக்கொள்ளும் உங்கள் மீட்சித்திறன் மற்றும் நெகிழ்வுத்தன்மையை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "திட்டங்கள் மாறும்போது தழுவுவது, சிரமங்களை சமாளிப்பது மற்றும் பின்னடைவுகளுக்குப் பிறகு மீண்டும் முன்னேறுவது பற்றி நினைத்துப் பாருங்கள்.",
    },


    leadership_social_influence: {

      question:
        "உங்கள் தலைமைத்துவம் மற்றும் சமூக செல்வாக்கு திறனை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "மற்றவர்களுக்கு வழிகாட்டுதல், கருத்துகளைப் பகிர்தல், ஊக்குவித்தல் அல்லது ஒரு குழுவில் நல்ல தாக்கத்தை ஏற்படுத்துதல் பற்றி நினைத்துப் பாருங்கள்.",
    },


    creative_thinking: {

      question:
        "உங்கள் படைப்பாற்றல் சிந்தனை திறனை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "புதிய யோசனைகளை உருவாக்குவது அல்லது ஒரு பிரச்சினையை வேறு விதமாக தீர்க்கும் வழிகளை கண்டுபிடிப்பது பற்றி நினைத்துப் பாருங்கள்.",
    },


    motivation_self_awareness: {

      question:
        "உங்கள் உந்துதல் மற்றும் சுய விழிப்புணர்வை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "உங்கள் பலங்களையும் மேம்படுத்த வேண்டிய பகுதிகளையும் புரிந்துகொண்டு, உங்கள் இலக்குகளை நோக்கி உங்களைத் தொடர்ந்து ஊக்குவிப்பது பற்றி நினைத்துப் பாருங்கள்.",
    },


    technological_literacy: {

      question:
        "உங்கள் தொழில்நுட்ப அறிவை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "தொழில்நுட்பம் மற்றும் டிஜிட்டல் கருவிகளைப் பயன்படுத்துவதிலும், புதிய செயலிகள் அல்லது அமைப்புகளை கற்றுக்கொள்வதிலும் நீங்கள் எவ்வளவு வசதியாக உள்ளீர்கள் என்பதை நினைத்துப் பாருங்கள்.",
    },


    empathy_active_listening: {

      question:
        "உங்கள் பரிவு மற்றும் செயலில் கேட்கும் திறனை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "மற்றவர்கள் கூறுவதைக் கவனமாகக் கேட்டு, அவர்களின் பார்வையைப் புரிந்து கொண்டு, கவனத்துடன் பதிலளிப்பது பற்றி நினைத்துப் பாருங்கள்.",
    },


    curiosity_lifelong_learning: {

      question:
        "உங்கள் ஆர்வம் மற்றும் தொடர்ந்து கற்கும் விருப்பத்தை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "புதிய விஷயங்களை கற்றுக்கொள்வது, கேள்விகள் கேட்பது மற்றும் காலப்போக்கில் உங்கள் அறிவையும் திறன்களையும் வளர்த்துக்கொள்ளும் ஆர்வத்தை நினைத்துப் பாருங்கள்.",
    },


    talent_management: {

      question:
        "உங்கள் திறமை மேலாண்மை திறனை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "உங்கள் அல்லது மற்றவர்களின் பலங்களை அடையாளம் கண்டு, அவற்றை நல்ல முறையில் பயன்படுத்த அல்லது வளர்க்கும் திறனை நினைத்துப் பாருங்கள்.",
    },


    service_orientation: {

      question:
        "உங்கள் சேவை நோக்கத்தை எவ்வாறு மதிப்பிடுவீர்கள்?",

      description:
        "மற்றவர்களின் தேவைகளைப் புரிந்துகொண்டு, மரியாதையுடனும் பயனுள்ள முறையிலும் உதவுவதற்கான உங்கள் விருப்பத்தையும் திறனையும் நினைத்துப் பாருங்கள்.",
    },
  },
};


// ============================================================
// OPTION GENERATOR
// ============================================================

const getOptions = (
  language,
  canonicalValues
) => {

  return canonicalValues.map(
    (value) => {

      return createOption(
        value,

        VALUE_LABELS[language]?.[value]
        ??
        String(value)
      );
    }
  );
};


// ============================================================
// BUILD QUESTIONS
// ============================================================

const buildQuestions = (
  language
) => {

  const text =
    QUESTION_TEXT[language];

  const ratingLabels =
    RATING_LABELS[language];


  return [

    // ========================================================
    // DEMOGRAPHIC
    // ========================================================

    {
      key: "age",

      type: "choice",

      ...text.age,

      options:
        AGE_OPTIONS,
    },


    {
      key: "gender",

      type: "choice",

      ...text.gender,

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.gender
        ),
    },


    {
      key: "marital_status",

      type: "choice",

      ...text.marital_status,

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.marital_status
        ),
    },


    {
        key: "household_size",

        type: "choice",

        ...text.household_size,

        options:
          HOUSEHOLD_SIZE_OPTIONS[language],
    },


    // ========================================================
    // EDUCATION
    // ========================================================

    {
      key: "education_level",

      type: "choice",

      ...text.education_level,

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.education_level
        ),
    },


    {
      key: "field_of_study",

      type: "choice",

      ...text.field_of_study,

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.field_of_study
        ),
    },


    {
      key: "time_since_studies",

      type: "choice",

      ...text.time_since_studies,

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.time_since_studies
        ),
    },


    // ========================================================
    // STRUCTURAL / DIGITAL
    // ========================================================

    {
      key: "province",

      type: "choice",

      ...text.province,

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.province
        ),
    },


    {
      key: "digital_access",

      type: "choice",

      ...text.digital_access,

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.digital_access
        ),
    },


    {
      key: "english_communication",

      type: "rating",

      ...text.english_communication,

      scaleLabels:
        ratingLabels,
    },


    {
      key: "digital_confidence",

      type: "rating",

      ...text.digital_confidence,

      scaleLabels:
        ratingLabels,
    },


    // ========================================================
    // TRAINING
    // ========================================================

    {
      key: "formal_training",

      type: "choice",

      ...text.formal_training,

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.formal_training
        ),
    },


    // --------------------------------------------------------
    // Only asked if formal_training = Yes
    // --------------------------------------------------------

    {
      key: "training_type",

      type: "choice",

      ...text.training_type,

      showIf: {
        key:
          "formal_training",

        equals:
          "Yes",
      },

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.training_type
        ),
    },


    {
      key: "training_field",

      type: "choice",

      ...text.training_field,

      showIf: {
        key:
          "formal_training",

        equals:
          "Yes",
      },

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.training_field
        ),
    },


    {
      key: "training_duration",

      type: "choice",

      ...text.training_duration,

      showIf: {
        key:
          "formal_training",

        equals:
          "Yes",
      },

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.training_duration
        ),
    },


    {
      key: "training_relevance",

      type: "choice",

      ...text.training_relevance,

      showIf: {
        key:
          "formal_training",

        equals:
          "Yes",
      },

      options:
        getOptions(
          language,
          CANONICAL_OPTIONS.training_relevance
        ),
    },


    // ========================================================
    // 10 SKILL FEATURES
    // ========================================================

    {
      key:
        "analytical_thinking",

      type:
        "rating",

      ...text.analytical_thinking,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "resilience_flexibility_agility",

      type:
        "rating",

      ...text.resilience_flexibility_agility,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "leadership_social_influence",

      type:
        "rating",

      ...text.leadership_social_influence,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "creative_thinking",

      type:
        "rating",

      ...text.creative_thinking,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "motivation_self_awareness",

      type:
        "rating",

      ...text.motivation_self_awareness,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "technological_literacy",

      type:
        "rating",

      ...text.technological_literacy,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "empathy_active_listening",

      type:
        "rating",

      ...text.empathy_active_listening,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "curiosity_lifelong_learning",

      type:
        "rating",

      ...text.curiosity_lifelong_learning,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "talent_management",

      type:
        "rating",

      ...text.talent_management,

      scaleLabels:
        ratingLabels,
    },


    {
      key:
        "service_orientation",

      type:
        "rating",

      ...text.service_orientation,

      scaleLabels:
        ratingLabels,
    },
  ];
};


// ============================================================
// MAIN TRANSLATIONS
// ============================================================

export const translations = {

  // ==========================================================
  // ENGLISH
  // ==========================================================

  en: {

    languageName:
      "English",

    welcome:
      "Welcome to the Employability Assessment Assistant",

    intro:
      "I’ll guide you through a short conversation about your background, education, training, digital capabilities, and employability skills.",

    start:
      "Start Assessment",

    finish:
      "Generate My Employability Analysis",

    returningText:
      "Already completed an assessment?",

    continueConversation:
      "Continue to Career Guidance",

    loadingTitle:
      "Analyzing Your Profile...",

    loadingSubtitle:
      "Your responses are being analyzed by the employability prediction model.",

    completionTitle:
      "Great. I now have enough information.",

    completionSubtitle:
      "Your responses are ready for employability analysis.",


    // --------------------------------------------------------
    // Prediction status
    // --------------------------------------------------------

    statusLabels: {

      positive_employment_outcome:
        "Positive Employment Outcome",

      negative_employment_outcome:
        "Needs Further Strengthening",
    },


    // --------------------------------------------------------
    // Result-side interface text
    // --------------------------------------------------------

    result: {

      assessmentResult:
        "Employability Assessment Result",

      modelExplanation:
        "Factors Influencing the Prediction",

      pushedHigher:
        "Factors that pushed the prediction higher",

      pushedLower:
        "Factors that pushed the prediction lower",

      retakeAssessment:
        "Retake Assessment",

      higherImpact:
        "Higher",

      lowerImpact:
        "Lower",
    },


    featureLabels:
      FEATURE_LABELS.en,

    valueLabels:
      VALUE_LABELS.en,

    questions:
      buildQuestions("en"),
  },


  // ==========================================================
  // SINHALA
  // ==========================================================

  si: {

    languageName:
      "සිංහල",

    welcome:
      "රැකියා හැකියාව ඇගයීම් සහායකයා වෙත සාදරයෙන් පිළිගනිමු",

    intro:
      "ඔබගේ පසුබිම, අධ්‍යාපනය, පුහුණුව, ඩිජිටල් හැකියාවන් සහ රැකියා හැකියා කුසලතා පිළිබඳ කෙටි සංවාදයක් හරහා මම ඔබට මඟ පෙන්වන්නෙමි.",

    start:
      "ඇගයීම ආරම්භ කරන්න",

    finish:
      "මගේ රැකියා හැකියාව විශ්ලේෂණය කරන්න",

    returningText:
      "ඔබ මීට පෙර ඇගයීම සම්පූර්ණ කර තිබේද?",

    continueConversation:
      "වෘත්තීය මාර්ගෝපදේශන සංවාදයට යන්න",

    loadingTitle:
      "ඔබගේ පැතිකඩ විශ්ලේෂණය කරමින්...",

    loadingSubtitle:
      "ඔබ ලබාදුන් පිළිතුරු රැකියා හැකියාව පුරෝකථන ආකෘතිය මඟින් විශ්ලේෂණය කරමින් පවතී.",

    completionTitle:
      "හොඳයි. දැන් අවශ්‍ය තොරතුරු ප්‍රමාණවත්.",

    completionSubtitle:
      "ඔබගේ පිළිතුරු රැකියා හැකියාව විශ්ලේෂණයට සූදානම්.",


    statusLabels: {

      positive_employment_outcome:
        "ධනාත්මක රැකියා ප්‍රතිඵලයක්",

      negative_employment_outcome:
        "රැකියා හැකියාව තවදුරටත් ශක්තිමත් කළ යුතුයි",
    },


    result: {

      assessmentResult:
        "රැකියා හැකියාව ඇගයීමේ ප්‍රතිඵලය",

      modelExplanation:
        "පුරෝකථනයට බලපෑ සාධක",

      pushedHigher:
        "පුරෝකථනය ඉහළට ගෙන ගිය සාධක",

      pushedLower:
        "පුරෝකථනය පහළට ගෙන ගිය සාධක",

      retakeAssessment:
        "නැවත ඇගයීම කරන්න",

      higherImpact:
        "ඉහළට",

      lowerImpact:
        "පහළට",
    },


    featureLabels:
      FEATURE_LABELS.si,

    valueLabels:
      VALUE_LABELS.si,

    questions:
      buildQuestions("si"),
  },


  // ==========================================================
  // TAMIL
  // ==========================================================

  ta: {

    languageName:
      "தமிழ்",

    welcome:
      "வேலைவாய்ப்பு மதிப்பீட்டு உதவியாளருக்கு வரவேற்கிறோம்",

    intro:
      "உங்கள் பின்னணி, கல்வி, பயிற்சி, டிஜிட்டல் திறன்கள் மற்றும் வேலைவாய்ப்பு திறன்களைப் பற்றிய ஒரு குறுகிய உரையாடலின் மூலம் நான் உங்களை வழிநடத்துவேன்.",

    start:
      "மதிப்பீட்டை தொடங்கவும்",

    finish:
      "என் வேலைவாய்ப்பு பகுப்பாய்வை உருவாக்கவும்",

    returningText:
      "ஏற்கனவே மதிப்பீட்டை முடித்துள்ளீர்களா?",

    continueConversation:
      "தொழில் வழிகாட்டல் உரையாடலுக்கு செல்லவும்",

    loadingTitle:
      "உங்கள் சுயவிவரம் பகுப்பாய்வு செய்யப்படுகிறது...",

    loadingSubtitle:
      "நீங்கள் வழங்கிய பதில்கள் வேலைவாய்ப்பு கணிப்பு மாதிரியால் பகுப்பாய்வு செய்யப்படுகின்றன.",

    completionTitle:
      "சரி. இப்போது தேவையான தகவல்கள் என்னிடம் உள்ளன.",

    completionSubtitle:
      "உங்கள் பதில்கள் வேலைவாய்ப்பு பகுப்பாய்விற்கு தயாராக உள்ளன.",


    statusLabels: {

      positive_employment_outcome:
        "நேர்மறையான வேலைவாய்ப்பு முடிவு",

      negative_employment_outcome:
        "வேலைவாய்ப்பு திறனை மேலும் வலுப்படுத்த வேண்டும்",
    },


    result: {

      assessmentResult:
        "வேலைவாய்ப்பு மதிப்பீட்டு முடிவு",

      modelExplanation:
        "கணிப்பை பாதித்த காரணிகள்",

      pushedHigher:
        "கணிப்பை உயர்த்திய காரணிகள்",

      pushedLower:
        "கணிப்பை குறைத்த காரணிகள்",

      retakeAssessment:
        "மதிப்பீட்டை மீண்டும் செய்யவும்",

      higherImpact:
        "உயர்த்தியது",

      lowerImpact:
        "குறைத்தது",
    },


    featureLabels:
      FEATURE_LABELS.ta,

    valueLabels:
      VALUE_LABELS.ta,

    questions:
      buildQuestions("ta"),
  },
};