import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getSavedEmployabilityProfile,
  saveEmployabilityProfile,
} from "../services/predictionStorage";

import {
  chatWithBot,
} from "../services/api";

import {
  translations,
} from "../data/questions";

import html2pdf from "html2pdf.js";

// ============================================================
// ROUTE PROFILE
// ============================================================

const getProfileFromRouteState = (
  state
) => {

  if (!state) {
    return null;
  }

  return (
    state.employabilityProfile
    ||
    state
  );
};


// ============================================================
// SKILLS / ABILITIES THAT CAN BE SHOWN TO THE USER
//
// These are all 1–5 rating features.
//
// IMPORTANT:
// Personal/background details such as age, gender,
// marital status, province and field of study are NOT shown
// to the user as reasons for a higher or lower result.
// ============================================================

const SKILL_AND_ABILITY_FEATURES = new Set([

  "analytical_thinking",

  "resilience_flexibility_agility",

  "leadership_social_influence",

  "creative_thinking",

  "motivation_self_awareness",

  "technological_literacy",

  "empathy_active_listening",

  "curiosity_lifelong_learning",

  "talent_management",

  "service_orientation",

  "english_communication",

  "digital_confidence",
]);


// ============================================================
// CHAT PAGE STATIC TEXT
//
// This only translates frontend text.
//
// It does NOT change:
// - chatbot API
// - chatbot model
// - chatbot request logic
// - conversation history logic
// ============================================================

const CHAT_TEXT = {

  // ==========================================================
  // ENGLISH
  // ==========================================================

  en: {

    sidebarTitle:
      "Employability Assessment",

    sidebarSubtitle:
      "A summary based on your assessment answers",

    statusLabel:
      "Assessment Status",

    modelOutcome:
      "Based on the answers you provided",


    // --------------------------------------------------------
    // WHAT INFLUENCED THIS RESULT
    // --------------------------------------------------------

    influenceTitle:
      "What Influenced This Result?",

    positiveInfluenceIntro:
      "These are some of the areas that helped support this result.",

    negativeInfluenceIntro:
      "These are some of the areas that were connected with a lower result in this assessment.",

    noClearInfluence:
      "Your result was based on several parts of your assessment considered together. There isn't a single skill or ability that can be clearly highlighted as the main reason for this result.",

    personalDetailsNote:
      "The assessment also considers background information you provided. Personal details such as your age, gender, marital status and where you live are not shown here as strengths, weaknesses, or things you should change.",

    downloadResult:
      "Download PDF",

    retake:
      "Retake Assessment",

    chatTitle:
      "Career Guidance ",

    chatSubtitle:
      "Ask about your assessment, skills, CV, interviews, and career path.",

    inputPlaceholder:
      "Ask about your result, skills, CV, interviews, or career path...",

    send:
      "Send",

    thinking:
      "Thinking...",

    noAssessmentTitle:
      "No Assessment Found",

    noAssessmentText:
      "Please complete the employability assessment before starting a personalized chatbot conversation.",

    startAssessment:
      "Start Assessment",

    connectionError:
      "Sorry, I could not connect to the employability chatbot backend. Please check whether the backend server is running and try again.",

    welcome: (
      predictionLabel
    ) =>
      `Your employability assessment has been loaded. Your current assessment result is ${predictionLabel}. I can use your assessment profile and model explanation to help you understand your result, discuss your skills, prepare your CV, practice for interviews, and explore career options.`,

    suggestedQuestions: [
      "Why did I get this result?",
      "How can I improve my employability?",
      "Explain the factors influencing my prediction",
      "Which skills should I focus on?",
      "Help me prepare my CV",
      "How should I prepare for interviews?",
    ],
  },


  // ==========================================================
  // SINHALA
  // ==========================================================

  si: {

    sidebarTitle:
      "රැකියා හැකියාව ඇගයීම",

    sidebarSubtitle:
      "ඔබ ලබාදුන් පිළිතුරු මත පදනම් වූ ඇගයීම් සාරාංශයක්",

    statusLabel:
      "ඇගයීම් තත්ත්වය",

    modelOutcome:
      "ඔබ ලබාදුන් පිළිතුරු මත පදනම් වේ",


    // --------------------------------------------------------
    // WHAT INFLUENCED THIS RESULT
    // --------------------------------------------------------

    influenceTitle:
      "මෙම ප්‍රතිඵලයට බලපෑ දේවල් මොනවාද?",

    positiveInfluenceIntro:
      "මෙම ප්‍රතිඵලයට සහාය වූ ඔබගේ හැකියා සහ කුසලතා අතරින් කිහිපයක් මෙහි දැක්වේ.",

    negativeInfluenceIntro:
      "මෙම ඇගයීමේදී පහළ ප්‍රතිඵලයක් සමඟ සම්බන්ධ වූ ඔබගේ හැකියා සහ කුසලතා අතරින් කිහිපයක් මෙහි දැක්වේ.",

    noClearInfluence:
      "ඔබගේ ප්‍රතිඵලය ඇගයීමේ පිළිතුරු කිහිපයක් එකට සලකා බැලීමෙන් ලැබුණු එකකි. මෙම ප්‍රතිඵලයට ප්‍රධාන හේතුව ලෙස එක් කුසලතාවක් හෝ හැකියාවක් පැහැදිලිව පෙන්විය නොහැක.",

    personalDetailsNote:
      "ඔබ ලබාදුන් පසුබිම් තොරතුරුද ඇගයීමේදී සලකා බලනු ලැබේ. වයස, ස්ත්‍රී පුරුෂ භාවය, විවාහක තත්ත්වය සහ ඔබ ජීවත් වන ස්ථානය වැනි පුද්ගලික තොරතුරු මෙහි ශක්ති, දුර්වලතා හෝ ඔබ වෙනස් කළ යුතු දේවල් ලෙස පෙන්වන්නේ නැත.",

    downloadResult:
      "PDF බාගන්න",

    retake:
      "නැවත ඇගයීම කරන්න",

    chatTitle:
      "වෘත්තීය මාර්ගෝපදේශනය",

    chatSubtitle:
      "ඔබගේ ඇගයීම, කුසලතා, CV, සම්මුඛ පරීක්ෂණ සහ වෘත්තීය මාර්ගය පිළිබඳ අසන්න.",

    inputPlaceholder:
      "ඔබගේ ප්‍රතිඵලය, කුසලතා, CV, සම්මුඛ පරීක්ෂණ හෝ වෘත්තීය මාර්ගය පිළිබඳ අසන්න...",

    send:
      "යවන්න",

    thinking:
      "සිතමින්...",

    noAssessmentTitle:
      "ඇගයීමක් හමු නොවීය",

    noAssessmentText:
      "පුද්ගලීකරණය කළ වෘත්තීය මාර්ගෝපදේශන සංවාදයක් ආරම්භ කිරීමට පෙර කරුණාකර රැකියා හැකියාව ඇගයීම සම්පූර්ණ කරන්න.",

    startAssessment:
      "ඇගයීම ආරම්භ කරන්න",

    connectionError:
      "රැකියා හැකියාව වෘත්තීය මාර්ගෝපදේශන සේවාව සමඟ සම්බන්ධ වීමට නොහැකි විය. Backend සේවාව ක්‍රියාත්මකදැයි පරීක්ෂා කර නැවත උත්සාහ කරන්න.",

    welcome: (
      predictionLabel
    ) =>
      `ඔබගේ රැකියා හැකියාව ඇගයීම සම්පූර්ණ වී ඇත. ඔබගේ වර්තමාන ඇගයීම් ප්‍රතිඵලය "${predictionLabel}" ලෙස දැක්වේ. ඔබගේ ඇගයීම් පැතිකඩ සහ ආකෘති පැහැදිලි කිරීම භාවිතා කරමින් ඔබගේ ප්‍රතිඵලය තේරුම් ගැනීමට, කුසලතා පිළිබඳ සාකච්ඡා කිරීමට, CV සකස් කිරීමට, සම්මුඛ පරීක්ෂණ සඳහා සූදානම් වීමට සහ වෘත්තීය විකල්ප සොයා බැලීමට මට ඔබට උපකාර කළ හැකිය.`,

    suggestedQuestions: [
      "මට මෙම ප්‍රතිඵලය ලැබුණේ ඇයි?",
      "මගේ රැකියා හැකියාව වැඩිදියුණු කරගන්නේ කෙසේද?",
      "මගේ පුරෝකථනයට බලපෑ සාධක පැහැදිලි කරන්න",
      "මම අවධානය යොමු කළ යුතු කුසලතා මොනවාද?",
      "මගේ CV එක සකස් කිරීමට උදව් කරන්න",
      "සම්මුඛ පරීක්ෂණ සඳහා සූදානම් වන්නේ කෙසේද?",
    ],
  },


  // ==========================================================
  // TAMIL
  // ==========================================================

  ta: {

    sidebarTitle:
      "வேலைவாய்ப்பு மதிப்பீடு",

    sidebarSubtitle:
      "நீங்கள் வழங்கிய பதில்களின் அடிப்படையிலான மதிப்பீட்டு சுருக்கம்",

    statusLabel:
      "மதிப்பீட்டு நிலை",

    modelOutcome:
      "நீங்கள் வழங்கிய பதில்களின் அடிப்படையில்",


    // --------------------------------------------------------
    // WHAT INFLUENCED THIS RESULT
    // --------------------------------------------------------

    influenceTitle:
      "இந்த முடிவை பாதித்தவை என்ன?",

    positiveInfluenceIntro:
      "இந்த முடிவை ஆதரிக்க உதவிய உங்கள் திறன்கள் மற்றும் ஆற்றல்களில் சில இங்கே காட்டப்பட்டுள்ளன.",

    negativeInfluenceIntro:
      "இந்த மதிப்பீட்டில் குறைந்த முடிவுடன் தொடர்புடைய உங்கள் திறன்கள் மற்றும் ஆற்றல்களில் சில இங்கே காட்டப்பட்டுள்ளன.",

    noClearInfluence:
      "உங்கள் மதிப்பீட்டில் வழங்கிய பல பதில்கள் ஒன்றாகக் கருதப்பட்டு இந்த முடிவு உருவானது. இந்த முடிவிற்கான முக்கிய காரணமாக ஒரு தனிப்பட்ட திறனை தெளிவாகக் குறிப்பிட முடியாது.",

    personalDetailsNote:
      "நீங்கள் வழங்கிய பின்னணி தகவல்களும் மதிப்பீட்டில் கருத்தில் கொள்ளப்படுகின்றன. வயது, பாலினம், திருமண நிலை மற்றும் நீங்கள் வசிக்கும் இடம் போன்ற தனிப்பட்ட தகவல்கள் இங்கே பலம், பலவீனம் அல்லது நீங்கள் மாற்ற வேண்டிய விஷயங்களாக காட்டப்படுவதில்லை.",

    downloadResult:
      "PDF பதிவிறக்கவும்",

    retake:
      "மதிப்பீட்டை மீண்டும் செய்யவும்",

    chatTitle:
      "தொழில் வழிகாட்டல் உரையாடல்",

    chatSubtitle:
      "உங்கள் மதிப்பீடு, திறன்கள், CV, நேர்காணல் மற்றும் தொழில் பாதை பற்றி கேளுங்கள்.",

    inputPlaceholder:
      "உங்கள் முடிவு, திறன்கள், CV, நேர்காணல் அல்லது தொழில் பாதை பற்றி கேளுங்கள்...",

    send:
      "அனுப்பு",

    thinking:
      "சிந்திக்கிறது...",

    noAssessmentTitle:
      "மதிப்பீடு கிடைக்கவில்லை",

    noAssessmentText:
      "தனிப்பயனாக்கப்பட்ட தொழில் வழிகாட்டல் உரையாடலைத் தொடங்குவதற்கு முன் வேலைவாய்ப்பு மதிப்பீட்டை முடிக்கவும்.",

    startAssessment:
      "மதிப்பீட்டை தொடங்கவும்",

    connectionError:
      "வேலைவாய்ப்பு தொழில் வழிகாட்டல் backend சேவையுடன் இணைக்க முடியவில்லை. Backend இயங்குகிறதா என்பதை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",

    welcome: (
      predictionLabel
    ) =>
      `உங்கள் வேலைவாய்ப்பு மதிப்பீடு ஏற்றப்பட்டுள்ளது. உங்கள் தற்போதைய மதிப்பீட்டு முடிவு "${predictionLabel}" ஆகும். உங்கள் மதிப்பீட்டு சுயவிவரத்தையும் மாதிரி விளக்கத்தையும் பயன்படுத்தி உங்கள் முடிவைப் புரிந்துகொள்ள, திறன்களைப் பற்றி பேச, CV தயாரிக்க, நேர்காணல்களுக்கு தயாராக மற்றும் தொழில் வாய்ப்புகளை ஆராய நான் உதவ முடியும்.`,

    suggestedQuestions: [
      "எனக்கு இந்த முடிவு ஏன் கிடைத்தது?",
      "என் வேலைவாய்ப்பு திறனை எவ்வாறு மேம்படுத்தலாம்?",
      "என் கணிப்பை பாதித்த காரணிகளை விளக்கவும்",
      "நான் எந்த திறன்களில் கவனம் செலுத்த வேண்டும்?",
      "என் CV தயாரிக்க உதவுங்கள்",
      "நேர்காணல்களுக்கு நான் எவ்வாறு தயாராக வேண்டும்?",
    ],
  },
};


// ============================================================
// COMPONENT
// ============================================================

export default function ChatbotPage() {

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const messagesEndRef =
    useRef(null);


  const fileInputRef =
    useRef(null);

  const assessmentPdfRef =
    useRef(null);
  // ==========================================================
  // GET PROFILE
  // ==========================================================

  const routeProfile =
    getProfileFromRouteState(
      location.state
    );


  const [storedProfile] =
    useState(
      () => {

        return (
          routeProfile
          ||
          getSavedEmployabilityProfile()
        );
      }
    );


  const employabilityProfile =
    routeProfile
    ||
    storedProfile;


  // ==========================================================
  // LANGUAGE
  // ==========================================================

  const selectedLanguage =
    employabilityProfile
      ?.selectedLanguage
    ||
    "en";


  const langData =
    translations[
      selectedLanguage
    ]
    ||
    translations.en;


  const chatText =
    CHAT_TEXT[
      selectedLanguage
    ]
    ||
    CHAT_TEXT.en;


  // ==========================================================
  // LOCALIZE PREDICTION STATUS
  // ==========================================================

  const getFriendlyPredictionLabel = (
    predictionResult
  ) => {

    return (
      langData
        ?.statusLabels
        ?.[predictionResult]
      ||
      predictionResult
      ||
      "Unknown"
    );
  };


  // ==========================================================
  // FRIENDLY 1–5 RATING LABEL
  // ==========================================================

  const getRatingLabel = (
    value
  ) => {

    const numericValue =
      Number(value);


    const ratingLabels = {

      en: {
        1: "Very low",
        2: "Low",
        3: "Moderate",
        4: "Good",
        5: "Very good",
      },

      si: {
        1: "ඉතා අඩු",
        2: "අඩු",
        3: "මධ්‍යම",
        4: "හොඳ",
        5: "ඉතා හොඳ",
      },

      ta: {
        1: "மிகக் குறைவு",
        2: "குறைவு",
        3: "மிதமான",
        4: "நன்று",
        5: "மிக நன்று",
      },
    };


    return (
      ratingLabels[
        selectedLanguage
      ]?.[numericValue]
      ||
      ratingLabels.en[
        numericValue
      ]
      ||
      String(value)
    );
  };


  // ==========================================================
  // FRIENDLY STATUS
  // ==========================================================

  const friendlyPrediction =
    employabilityProfile
      ? getFriendlyPredictionLabel(
          employabilityProfile
            .predictionResult
        )
      : "";


  // ==========================================================
  // USER-FACING RESULT EXPLANATION
  //
  // IMPORTANT:
  //
  // The backend still keeps the full SHAP explanation.
  //
  // The UI only shows:
  //
  // Positive Employment Outcome
  //   → positive SHAP factors
  //   → only 1–5 skills/capabilities
  //   → only ratings 4 or 5
  //
  // Needs Further Strengthening
  //   → negative SHAP factors
  //   → only 1–5 skills/capabilities
  //   → only ratings 1 or 2
  //
  // This prevents confusing displays such as:
  //
  // Needs Further Strengthening
  // Service orientation
  // Very good · 5/5
  //
  // Personal/background details are not shown as reasons.
  // ==========================================================

  const predictionResult =
    employabilityProfile
      ?.predictionResult
    ||
    "";


  const isPositiveOutcome =
    predictionResult
    ===
    "positive_employment_outcome";


  const isNegativeOutcome =
    predictionResult
    ===
    "negative_employment_outcome";


  // ----------------------------------------------------------
  // Select only the SHAP direction that matches
  // the final assessment result.
  // ----------------------------------------------------------

  const candidateInfluenceFactors =
    isPositiveOutcome
      ? (
          employabilityProfile
            ?.shapPositiveFactors
          || []
        )
      : isNegativeOutcome
        ? (
            employabilityProfile
              ?.shapNegativeFactors
            || []
          )
        : [];


  // ----------------------------------------------------------
  // Decide whether a factor is suitable to show
  // to an ordinary user.
  // ----------------------------------------------------------

  const shouldShowInfluenceFactor = (
    factor
  ) => {

    if (
      !factor
      ||
      !SKILL_AND_ABILITY_FEATURES.has(
        factor.feature_key
      )
    ) {
      return false;
    }


    const rating =
      Number(
        factor.value
      );


    if (
      !Number.isFinite(
        rating
      )
    ) {
      return false;
    }


    // --------------------------------------------------------
    // Positive result:
    //
    // Only clearly strong ratings are shown.
    // --------------------------------------------------------

    if (
      isPositiveOutcome
    ) {

      return (
        rating >= 4
        &&
        rating <= 5
      );
    }


    // --------------------------------------------------------
    // Needs Further Strengthening:
    //
    // Only clearly low ratings are shown.
    // --------------------------------------------------------

    if (
      isNegativeOutcome
    ) {

      return (
        rating >= 1
        &&
        rating <= 2
      );
    }


    return false;
  };


  // ----------------------------------------------------------
  // Final factors visible to the user
  // ----------------------------------------------------------

  const visibleInfluenceFactors =
    candidateInfluenceFactors
      .filter(
        shouldShowInfluenceFactor
      )
      .slice(0, 3);


  // ==========================================================
  // RENDER USER-FRIENDLY INFLUENCE FACTOR
  // ==========================================================

  const renderInfluenceFactor = (
    factor,
    index
  ) => {

    const featureLabel =
      langData
        ?.featureLabels
        ?.[factor.feature_key]
      ||
      factor.feature_key;


    const ratingLabel =
      getRatingLabel(
        factor.value
      );


    return (

      <div

        key={
          `influence-${factor.feature_key}-${index}`
        }

        style={
          styles.factorCard
        }
      >

        <div
          style={
            styles.factorName
          }
        >

          {
            featureLabel
          }

        </div>


        <div
          style={
            styles.ratingLine
          }
        >

          <strong
            style={
              styles.ratingWord
            }
          >

            {
              ratingLabel
            }

          </strong>


          <span
            style={
              styles.ratingScore
            }
          >

            {
              `${factor.value}/5`
            }

          </span>

        </div>

      </div>
    );
  };


  // ==========================================================
  // INITIAL CHAT MESSAGE
  //
  // Same chatbot behaviour as before.
  // Only old probability/DiCE wording was removed.
  // ==========================================================

  const [messages, setMessages] =
    useState(
      () => {

        if (
          !employabilityProfile
        ) {
          return [];
        }


        return [
          {
            role:
              "assistant",

            content:
              chatText.welcome(
                getFriendlyPredictionLabel(
                  employabilityProfile
                    .predictionResult
                )
              ),
          },
        ];
      }
    );


  const [input, setInput] =
    useState("");


  const [
    isSending,
    setIsSending,
  ] = useState(false);


  // ==========================================================
  // UPLOADED DOCUMENT
  // ==========================================================

  const [
    uploadedDocument,
    setUploadedDocument,
  ] = useState(null);


  const [
    uploadedFileName,
    setUploadedFileName,
  ] = useState("");


  const [
    isUploadingDocument,
    setIsUploadingDocument,
  ] = useState(false);


  const [
    documentUploadError,
    setDocumentUploadError,
  ] = useState("");


  const [
    documentHasBeenSent,
    setDocumentHasBeenSent,
  ] = useState(false);


  // ==========================================================
  // SAVE ROUTE PROFILE
  // Existing behaviour preserved
  // ==========================================================

  useEffect(
    () => {

      if (
        routeProfile
      ) {

        saveEmployabilityProfile(
          routeProfile
        );
      }

    },
    [routeProfile]
  );


  // ==========================================================
  // AUTO SCROLL
  // Existing behaviour preserved
  // ==========================================================

  useEffect(
    () => {

      messagesEndRef
        .current
        ?.scrollIntoView({
          behavior:
            "smooth",
        });

    },
    [
      messages,
      isSending,
    ]
  );


  // ==========================================================
  // DOCUMENT UPLOAD
  // ==========================================================

useEffect(() => {
  if (!documentUploadError) return;

  const timer = setTimeout(() => {
    setDocumentUploadError("");
  }, 4000); // disappear after 4 seconds

  return () => clearTimeout(timer);
}, [documentUploadError]);


const handleDocumentUpload = async (
  event
) => {

  const file =
    event.target.files?.[0];


  if (!file) {
    return;
  }


  // Clear any previous upload error
  setDocumentUploadError(
    ""
  );


  const lowerName =
    file.name.toLowerCase();


  const supported =
    lowerName.endsWith(
      ".pdf"
    )
    ||
    lowerName.endsWith(
      ".docx"
    );


    if (!supported) {

      setDocumentUploadError(
        "Please upload a PDF or Word (.docx) document."
      );


      event.target.value =
        "";


      return;
    }


    const formData =
      new FormData();


    formData.append(
      "file",
      file
    );


    setIsUploadingDocument(
      true
    );


    try {

      const response =
        await fetch(
          "http://127.0.0.1:8000/document/upload",
          {
            method:
              "POST",

            body:
              formData,
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail
          ||
          "The document could not be uploaded."
        );
      }


      setUploadedDocument(
        data.document
      );


      setUploadedFileName(
        data.filename
      );


      setDocumentHasBeenSent(
        false
      );


      setDocumentUploadError(
        ""
      );

    }

    catch (error) {

      console.error(
        "Document upload error:",
        error
      );


      setUploadedDocument(
        null
      );


      setUploadedFileName(
        ""
      );


      setDocumentUploadError(
        error.message
        ||
        "The document could not be uploaded."
      );

    }

    finally {

      setIsUploadingDocument(
        false
      );


      event.target.value =
        "";
    }
  };


  const handleRemoveDocument = () => {

    setUploadedDocument(
      null
    );


    setUploadedFileName(
      ""
    );


    setDocumentHasBeenSent(
      false
    );


    setDocumentUploadError(
      ""
    );
  };


  // ==========================================================
  // SEND CHAT MESSAGE
  //
  // IMPORTANT:
  //
  // Chatbot API logic is preserved.
  //
  // It still sends:
  //
  // {
  //   message,
  //   employabilityProfile,
  //   conversationHistory
  // }
  //
  // to POST /chat
  // ==========================================================

  const handleSendMessage = async (
    messageText = input
  ) => {

    const trimmedMessage =
      messageText.trim();


    if (
      !trimmedMessage
      ||
      isSending
      ||
      !employabilityProfile
    ) {
      return;
    }


    const userMessage = {
      role:
        "user",

      content:
        trimmedMessage,

      attachment:
        uploadedDocument
          ? {
              filename:
                uploadedFileName,

              documentType:
                uploadedDocument
                  .document_type,
            }
          : null,
    };


    setMessages(
      (previousMessages) => [
        ...previousMessages,
        userMessage,
      ]
    );


    setInput(
      ""
    );


    setIsSending(
      true
    );


    if (
      uploadedDocument
    ) {

      setDocumentHasBeenSent(
        true
      );
    }


    try {

      // Existing conversation-history logic preserved.
      const conversationHistory =
        messages
          .slice(-2)
          .map(
            (message) => ({
              role:
                message.role,

              content:
                message.content,
            })
          );


      // ======================================================
      // EXISTING CHATBOT API CALL — UNCHANGED
      // ======================================================

      const response =
        await chatWithBot({

          message:
            trimmedMessage,

          employabilityProfile,

          conversationHistory,

          uploadedDocument,
        });


      const assistantMessage = {

        role:
          "assistant",

        content:
          response.reply,
      };


      setMessages(
        (previousMessages) => [
          ...previousMessages,
          assistantMessage,
        ]
      );

    }

    catch (error) {

      console.error(
        "Chatbot error:",
        error
      );


      const errorMessage = {

        role:
          "assistant",

        content:
          chatText.connectionError,
      };


      setMessages(
        (previousMessages) => [
          ...previousMessages,
          errorMessage,
        ]
      );

    }

    finally {

      setIsSending(
        false
      );
    }
  };


  // ==========================================================
  // SUGGESTED QUESTION
  // Existing behaviour preserved
  // ==========================================================

  const handleSuggestedQuestion = (
    question
  ) => {

    handleSendMessage(
      question
    );
  };

  // ==========================================================
// DOWNLOAD ASSESSMENT RESULT AS PDF
// ==========================================================

const handleDownloadAssessmentPdf = () => {

  if (
    !assessmentPdfRef.current
  ) {
    return;
  }


  const options = {

    margin:
      10,

    filename:
      "Employability_Assessment_Result.pdf",

    image: {
      type:
        "jpeg",

      quality:
        0.98,
    },

    html2canvas: {

      scale:
        2,

      useCORS:
        true,

      backgroundColor:
        "#ffffff",
    },

    jsPDF: {

      unit:
        "mm",

      format:
        "a4",

      orientation:
        "portrait",
    },

    pagebreak: {
      mode: [
        "avoid-all",
        "css",
        "legacy",
      ],
    },
  };


  html2pdf()
    .set(
      options
    )
    .from(
      assessmentPdfRef.current
    )
    .save();
};

  // ==========================================================
  // NO ASSESSMENT FALLBACK
  // ==========================================================

  if (
    !employabilityProfile
  ) {

    return (

      <main
        style={
          styles.pageWrapper
        }
      >

        <section
          style={
            styles.fallbackPanel
          }
        >

          <div
            style={
              styles.botAvatar
            }
          >
            AI
          </div>


          <h1
            style={
              styles.fallbackTitle
            }
          >

            {
              chatText
                .noAssessmentTitle
            }

          </h1>


          <p
            style={
              styles.fallbackText
            }
          >

            {
              chatText
                .noAssessmentText
            }

          </p>


          <button

            style={
              styles.primaryButton
            }

            onClick={
              () =>
                navigate("/")
            }
          >

            {
              chatText
                .startAssessment
            }

          </button>

        </section>

      </main>
    );
  }


  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (

    <main
      style={
        styles.pageWrapper
      }
    >

      <section
        style={
          styles.chatShell
        }
      >


        {/* ===================================================
            LEFT SIDE
            MODEL ASSESSMENT SUMMARY
        ==================================================== */}

        <aside
          style={
            styles.sidebar
          }
        >

          <div
            ref={
              assessmentPdfRef
            }

            style={
              styles.pdfAssessmentContent
            }
          >

          {/* -------------------------------------------------
              HEADER
          -------------------------------------------------- */}

          <div
            style={
              styles.sidebarHeader
            }
          >

            <div
              style={
                styles.botAvatar
              }
            >
              AI
            </div>


            <div>

              <h2
                style={
                  styles.sidebarTitle
                }
              >

                {
                  chatText.sidebarTitle
                }

              </h2>


              <p
                style={
                  styles.sidebarSubtitle
                }
              >

                {
                  chatText.sidebarSubtitle
                }

              </p>

            </div>

          </div>


          {/* -------------------------------------------------
              STATUS CARD
          -------------------------------------------------- */}

          <div
            style={
              styles.profileCard
            }
          >

            <p
              style={
                styles.cardLabel
              }
            >

              {
                chatText.statusLabel
              }

            </p>


            <h3
              style={
                styles.statusText
              }
            >

              {
                friendlyPrediction
              }

            </h3>


            {/* Same position previously used for probability.
                Probability is intentionally no longer shown. */}

            <p
              style={
                styles.probabilityText
              }
            >

              {
                chatText.modelOutcome
              }

            </p>

          </div>


          {/* -------------------------------------------------
              WHAT INFLUENCED THIS RESULT
          -------------------------------------------------- */}

          <div
            style={
              styles.miniSection
            }
          >

            <h4
              style={
                styles.miniTitle
              }
            >

              {
                chatText.influenceTitle
              }

            </h4>


            <p
              style={
                styles.sectionExplanation
              }
            >

              {
                isPositiveOutcome
                  ? chatText
                      .positiveInfluenceIntro
                  : chatText
                      .negativeInfluenceIntro
              }

            </p>


            {
              visibleInfluenceFactors.length > 0
              ? (

                <div
                  style={
                    styles.factorList
                  }
                >

                  {
                    visibleInfluenceFactors.map(
                      (
                        factor,
                        index
                      ) =>
                        renderInfluenceFactor(
                          factor,
                          index
                        )
                    )
                  }

                </div>

              )
              : (

                <p
                  style={
                    styles.emptyMiniText
                  }
                >

                  {
                    chatText.noClearInfluence
                  }

                </p>
              )
            }


            <div
              style={{
                ...styles.infoNotice,
                marginTop: "14px",
                marginBottom: 0,
              }}
            >

              {
                chatText.personalDetailsNote
              }

            </div>

          </div>
          
          </div>

          {/* -------------------------------------------------
              DOWNLOAD / RETAKE ASSESSMENT
          -------------------------------------------------- */}

          {/* -------------------------------------------------
          SIDEBAR ACTIONS
          -------------------------------------------------- */}

          <div
            style={
              styles.sidebarActions
            }
          >

            <button

              type="button"

              style={
                styles.downloadPdfButton
              }

              onClick={
                handleDownloadAssessmentPdf
              }

              title={
                chatText.downloadResult
              }
            >

              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >

                <path
                 d="M12 3v12"
                />

                <path
                  d="m7 10 5 5 5-5"
                />

                <path
                  d="M5 21h14"
                />

              </svg>

              {
                chatText.downloadResult
              }

            </button>


            <button

              style={
                styles.outlineButton
              }

              onClick={
                () =>
                  navigate("/")
              }
            >

              {
                chatText.retake
              }

            </button>

          </div>

        </aside>


        {/* ===================================================
            RIGHT SIDE
            CAREER GUIDANCE CHAT

            Chat behaviour remains the same.
        ==================================================== */}

        <section
          style={
            styles.chatArea
          }
        >


          {/* -------------------------------------------------
              CHAT HEADER
          -------------------------------------------------- */}

          <header
            style={
              styles.chatHeader
            }
          >

            <div>

              <h1
                style={
                  styles.chatTitle
                }
              >

                {
                  chatText.chatTitle
                }

              </h1>


              <p
                style={
                  styles.chatSubtitle
                }
              >

                {
                  chatText.chatSubtitle
                }

              </p>

            </div>


            <div
              style={
                styles.languageBadge
              }
            >

              {
                selectedLanguage
              }

            </div>

          </header>


          {/* -------------------------------------------------
              SUGGESTED QUESTIONS
          -------------------------------------------------- */}

          <section
            style={
              styles.suggestionArea
            }
          >

            {
              chatText
                .suggestedQuestions
                .map(
                  (question) => (

                    <button

                      key={
                        question
                      }

                      type="button"

                      style={
                        styles.suggestionButton
                      }

                      onClick={
                        () =>
                          handleSuggestedQuestion(
                            question
                          )
                      }

                      disabled={
                        isSending
                      }
                    >

                      {
                        question
                      }

                    </button>
                  )
                )
            }

          </section>


          {/* -------------------------------------------------
              CHAT MESSAGES
          -------------------------------------------------- */}

          <section
            style={
              styles.messagesArea
            }
          >

            {
              messages.map(
                (
                  message,
                  index
                ) => {

                  const isUser =
                    message.role
                    ===
                    "user";


                  return (

                    <div

                      key={
                        `${
                          message.role
                        }-${index}`
                      }

                      style={{
                        ...styles.messageRow,

                        justifyContent:
                          isUser
                            ? "flex-end"
                            : "flex-start",
                      }}
                    >

                      {
                        !isUser
                        && (

                          <div
                            style={
                              styles.smallAvatar
                            }
                          >
                            AI
                          </div>
                        )
                      }


                      {
                        isUser
                          ? (

                            <div
                              style={
                                styles.userMessageStack
                              }
                            >

                              {
                                message.attachment
                                && (

                                  <div
                                    style={
                                      styles.messageAttachment
                                    }
                                  >

                                    <span
                                      style={
                                        styles.messageAttachmentIcon
                                      }
                                    >
                                      📄
                                    </span>


                                    <div
                                      style={
                                        styles.messageAttachmentInfo
                                      }
                                    >

                                      <span
                                        style={
                                          styles.messageAttachmentName
                                        }
                                      >

                                        {
                                          message
                                            .attachment
                                            .filename
                                        }

                                      </span>


                                      <span
                                        style={
                                          styles.messageAttachmentType
                                        }
                                      >

                                        {
                                          message
                                            .attachment
                                            .documentType
                                            ?.replaceAll(
                                              "_",
                                              " "
                                            )
                                        }

                                      </span>

                                    </div>

                                  </div>
                                )
                              }


                              <div

                                style={{
                                  ...styles.messageBubble,
                                  ...styles.userBubble,
                                  maxWidth:
                                    "100%",
                                }}
                              >

                                {
                                  message.content
                                    .split("\n")
                                    .map(
                                      (
                                        line,
                                        lineIndex
                                      ) => (

                                        <span
                                          key={
                                            `${line}-${lineIndex}`
                                          }
                                        >

                                          {
                                            line
                                          }

                                          <br />

                                        </span>
                                      )
                                    )
                                }

                              </div>

                            </div>

                          )
                          : (

                            <div

                              style={{
                                ...styles.messageBubble,
                                ...styles.assistantBubble,
                              }}
                            >

                              {
                                message.content
                                  .split("\n")
                                  .map(
                                    (
                                      line,
                                      lineIndex
                                    ) => (

                                      <span
                                        key={
                                          `${line}-${lineIndex}`
                                        }
                                      >

                                        {
                                          line
                                        }

                                        <br />

                                      </span>
                                    )
                                  )
                              }

                            </div>
                          )
                      }

                    </div>
                  );
                }
              )
            }


            {/* ------------------------------------------------
                TYPING INDICATOR
            ------------------------------------------------- */}

            {
              isSending
              && (

                <div
                  style={
                    styles.messageRow
                  }
                >

                  <div
                    style={
                      styles.smallAvatar
                    }
                  >
                    AI
                  </div>


                  <div

                    style={{
                      ...styles.messageBubble,
                      ...styles.assistantBubble,
                    }}
                  >

                    <span
                      style={
                        styles.typingDot
                      }
                    >
                      ●
                    </span>

                    {" "}

                    <span
                      style={
                        styles.typingText
                      }
                    >

                      {
                        chatText.thinking
                      }

                    </span>

                  </div>

                </div>
              )
            }


            <div
              ref={
                messagesEndRef
              }
            />

          </section>


          {/* -------------------------------------------------
              ATTACHED DOCUMENT STATUS
          -------------------------------------------------- */}

          {
            (
              (
                uploadedDocument
                &&
                !documentHasBeenSent
              )
              ||
              isUploadingDocument
              ||
              documentUploadError
            )
            && (

              <div
                style={
                  styles.documentStatusArea
                }
              >

                {
                  isUploadingDocument
                  && (

                    <div
                      style={
                        styles.documentChip
                      }
                    >

                      Reading document...

                    </div>
                  )
                }


                {
                  uploadedDocument
                  &&
                  !documentHasBeenSent
                  &&
                  !isUploadingDocument
                  && (

                    <div
                      style={
                        styles.documentChip
                      }
                    >

                      <span
                        style={
                          styles.documentIcon
                        }
                      >
                        📄
                      </span>


                      <div
                        style={
                          styles.documentInfo
                        }
                      >

                        <span
                          style={
                            styles.documentName
                          }
                        >

                          {
                            uploadedFileName
                          }

                        </span>


                        <span
                          style={
                            styles.documentType
                          }
                        >

                          {
                            uploadedDocument
                              .document_type
                              ?.replaceAll(
                                "_",
                                " "
                              )
                          }

                        </span>

                      </div>


                      <button

                        type="button"

                        style={
                          styles.removeDocumentButton
                        }

                        onClick={
                          handleRemoveDocument
                        }

                        title="Remove document"

                        aria-label="Remove attached document"
                      >

                        ×

                      </button>

                    </div>
                  )
                }


                {
                  documentUploadError
                  && (

                    <div
                      style={
                        styles.documentError
                      }
                    >

                      {
                        documentUploadError
                      }

                    </div>
                  )
                }

              </div>
            )
          }


          {/* -------------------------------------------------
              MESSAGE INPUT

              Existing chat submit logic preserved.
          -------------------------------------------------- */}

          <form

            style={
              styles.inputArea
            }

            onSubmit={
              (event) => {

                event.preventDefault();

                handleSendMessage();
              }
            }
          >

            <div
              style={
                styles.inputWrapper
              }
            >

              <input

                ref={
                  fileInputRef
                }

                type="file"

                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

                style={{
                  display:
                    "none",
                }}

                onChange={
                  handleDocumentUpload
                }
              />


              <button

                type="button"

                title="Attach PDF or Word document"

                aria-label="Attach PDF or Word document"

                style={{
                  ...styles.attachmentButton,

                  opacity:
                    isUploadingDocument
                      ? 0.5
                      : 1,
                }}

                disabled={
                  isUploadingDocument
                  ||
                  isSending
                }

                onClick={
                  () =>
                    fileInputRef
                      .current
                      ?.click()
                }
              >

                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                  />
                </svg>

              </button>


              {
                uploadedDocument
                &&
                documentHasBeenSent
                && (

                  <div
                    style={
                      styles.activeDocumentPill
                    }

                    title={
                      uploadedFileName
                    }
                  >

                    <span
                      style={
                        styles.activeDocumentLabel
                      }
                    >
                      Document active
                    </span>


                    <button

                      type="button"

                      style={
                        styles.activeDocumentRemove
                      }

                      onClick={
                        handleRemoveDocument
                      }

                      title="Remove document"

                      aria-label="Remove active document"
                    >
                      ×
                    </button>

                  </div>
                )
              }


              <input

                style={
                  styles.input
                }

                type="text"

                value={
                  input
                }

                placeholder={
                  isUploadingDocument
                    ? "Reading document..."
                    : chatText
                        .inputPlaceholder
                }

                onChange={
                  (event) => {

                    setInput(
                      event.target.value
                    );

                  }
                }

                disabled={
                  isSending
                  ||
                  isUploadingDocument
                }
              />

            </div>


            <button

              style={{
                ...styles.sendButton,

                opacity:
                  isSending
                  ||
                  !input.trim()
                    ? 0.6
                    : 1,
              }}

              type="submit"

              disabled={
                isSending
                ||
                !input.trim()
              }
            >

              {
                chatText.send
              }

            </button>

          </form>

        </section>

      </section>

    </main>
  );
}


// ============================================================
// STYLES
//
// EXISTING VISUAL DESIGN PRESERVED.
// ============================================================

const styles = {

  pageWrapper: {

    minHeight:
      "100vh",

    background:
      "linear-gradient(135deg, #f8fafc 0%, #eef5f9 45%, #f8fafc 100%)",

    padding:
      "28px",

    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

    color:
      "#0f172a",
  },


  chatShell: {

    width:
      "100%",

    maxWidth:
      "1240px",

    height:
      "calc(100vh - 56px)",

    margin:
      "0 auto",

    display:
      "grid",

    gridTemplateColumns:
      "400px minmax(0, 1fr)",

    gap:
      "18px",
  },


  sidebar: {

    backgroundColor:
      "rgba(255, 255, 255, 0.94)",

    border:
      "1px solid #dbe4ef",

    borderRadius:
      "24px",

    padding:
      "22px",

    boxShadow:
      "0 20px 45px rgba(15, 23, 42, 0.08)",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "16px",

    overflowY:
      "auto",
  },


  sidebarHeader: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "12px",
  },


  botAvatar: {

    width:
      "48px",

    height:
      "48px",

    minWidth:
      "48px",

    borderRadius:
      "16px",

    backgroundColor:
      "#0f172a",

    color:
      "#ffffff",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    fontWeight:
      "900",

    letterSpacing:
      "0.04em",

    boxShadow:
      "0 10px 20px rgba(15, 23, 42, 0.18)",
  },


  sidebarTitle: {

    margin:
      0,

    fontSize:
      "18px",

    fontWeight:
      "900",

    color:
      "#0f172a",
  },


  sidebarSubtitle: {

    margin:
      "4px 0 0",

    fontSize:
      "13px",

    lineHeight:
      1.45,

    color:
      "#64748b",
  },


  profileCard: {

    backgroundColor:
      "#0f172a",

    color:
      "#ffffff",

    borderRadius:
      "20px",

    padding:
      "18px",

    boxShadow:
      "0 14px 30px rgba(15, 23, 42, 0.2)",
  },


  cardLabel: {

    margin:
      0,

    fontSize:
      "12px",

    color:
      "#cbd5e1",

    fontWeight:
      "800",

    textTransform:
      "uppercase",

    letterSpacing:
      "0.08em",
  },


  statusText: {

    margin:
      "10px 0 4px",

    fontSize:
      "24px",

    fontWeight:
      "900",
  },


  probabilityText: {

    margin:
      0,

    color:
      "#e2e8f0",

    fontSize:
      "14px",

    lineHeight:
      1.45,
  },


  miniSection: {

    backgroundColor:
      "#f8fafc",

    border:
      "1px solid #e2e8f0",

    borderRadius:
      "18px",

    padding:
      "16px",
  },


  miniTitle: {

    margin:
      "0 0 12px",

    fontSize:
      "14px",

    color:
      "#0f172a",

    fontWeight:
      "900",

    lineHeight:
      1.4,
  },


  // ==========================================================
  // USER-FRIENDLY FACTOR DISPLAY
  // ==========================================================

  sectionExplanation: {

    margin:
      "0 0 14px",

    color:
      "#64748b",

    fontSize:
      "13px",

    lineHeight:
      1.55,
  },


  infoNotice: {

    backgroundColor:
      "#ffffff",

    border:
      "1px solid #e2e8f0",

    borderRadius:
      "14px",

    padding:
      "12px 13px",

    color:
      "#64748b",

    fontSize:
      "12px",

    lineHeight:
      1.55,

    marginBottom:
      "16px",
  },


  factorGroup: {

    marginTop:
      "14px",
  },


  factorGroupTitle: {

    color:
      "#475569",

    fontSize:
      "12px",

    fontWeight:
      "800",

    marginBottom:
      "8px",

    lineHeight:
      1.4,
  },


  factorList: {

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "8px",
  },


  factorCard: {

    backgroundColor:
      "#ffffff",

    border:
      "1px solid #dbe4ef",

    borderRadius:
      "14px",

    padding:
      "12px 13px",
  },


  factorName: {

    color:
      "#0f172a",

    fontSize:
      "13px",

    fontWeight:
      "800",

    lineHeight:
      1.4,
  },


  ratingLine: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "7px",

    marginTop:
      "6px",
  },


  ratingWord: {

    color:
      "#334155",

    fontSize:
      "13px",
  },


  ratingScore: {

    color:
      "#64748b",

    fontSize:
      "12px",

    fontWeight:
      "700",
  },


  backgroundValue: {

    color:
      "#334155",

    fontSize:
      "13px",

    lineHeight:
      1.45,

    marginTop:
      "5px",
  },


  factorDirection: {

    color:
      "#64748b",

    fontSize:
      "11px",

    fontWeight:
      "600",

    marginTop:
      "7px",

    lineHeight:
      1.4,
  },


  // ==========================================================
  // EXISTING STYLES
  // ==========================================================

  tagList: {

    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      "8px",
  },


  softTag: {

    backgroundColor:
      "#ffffff",

    color:
      "#334155",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "999px",

    padding:
      "7px 10px",

    fontSize:
      "12px",

    fontWeight:
      "700",

    lineHeight:
      1.35,
  },


  recommendationList: {

    margin:
      0,

    paddingLeft:
      "18px",

    color:
      "#334155",

    fontSize:
      "13px",

    lineHeight:
      1.6,
  },


  emptyMiniText: {

    margin:
      0,

    color:
      "#94a3b8",

    fontSize:
      "13px",

    fontStyle:
      "italic",

    lineHeight:
      1.55,
  },


  secondaryButton: {

    marginTop:
      "auto",

    backgroundColor:
      "#e2e8f0",

    color:
      "#0f172a",

    border:
      "none",

    borderRadius:
      "14px",

    padding:
      "12px 16px",

    fontSize:
      "14px",

    fontWeight:
      "800",

    cursor:
      "pointer",
  },
  pdfAssessmentContent: {

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "16px",

  backgroundColor:
    "#ffffff",
},


sidebarActions: {

  marginTop:
    "auto",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "8px",
},


downloadPdfButton: {

  width:
    "100%",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap:
    "7px",

  backgroundColor:
    "#f8fafc",

  color:
    "#475569",

  border:
    "1px solid #cbd5e1",

  borderRadius:
    "12px",

  padding:
    "9px 12px",

  fontSize:
    "12px",

  fontWeight:
    "800",

  cursor:
    "pointer",
},

  outlineButton: {

    backgroundColor:
      "#ffffff",

    color:
      "#0f172a",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "14px",

    padding:
      "12px 16px",

    fontSize:
      "14px",

    fontWeight:
      "800",

    cursor:
      "pointer",
  },


  chatArea: {

    backgroundColor:
      "rgba(255, 255, 255, 0.94)",

    border:
      "1px solid #dbe4ef",

    borderRadius:
      "24px",

    boxShadow:
      "0 20px 45px rgba(15, 23, 42, 0.08)",

    display:
      "flex",

    flexDirection:
      "column",

    overflow:
      "hidden",
  },


  chatHeader: {

    padding:
      "22px 24px",

    borderBottom:
      "1px solid #e2e8f0",

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap:
      "16px",

    backgroundColor:
      "#ffffff",
  },


  chatTitle: {

    margin:
      0,

    fontSize:
      "24px",

    fontWeight:
      "900",

    color:
      "#0f172a",
  },


  chatSubtitle: {

    margin:
      "6px 0 0",

    color:
      "#64748b",

    fontSize:
      "14px",

    lineHeight:
      1.5,
  },


  languageBadge: {

    backgroundColor:
      "#f1f5f9",

    color:
      "#0f172a",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "999px",

    padding:
      "8px 12px",

    fontSize:
      "13px",

    fontWeight:
      "900",

    textTransform:
      "uppercase",
  },


  suggestionArea: {

    padding:
      "14px 24px",

    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      "8px",

    borderBottom:
      "1px solid #e2e8f0",

    backgroundColor:
      "#f8fafc",
  },


  suggestionButton: {

    border:
      "1px solid #cbd5e1",

    backgroundColor:
      "#ffffff",

    color:
      "#0f172a",

    borderRadius:
      "999px",

    padding:
      "8px 12px",

    fontSize:
      "13px",

    fontWeight:
      "700",

    cursor:
      "pointer",

    transition:
      "all 0.2s ease",
  },


  messagesArea: {

    flex:
      1,

    overflowY:
      "auto",

    padding:
      "24px",

    backgroundColor:
      "#f8fafc",
  },


  messageRow: {

    display:
      "flex",

    alignItems:
      "flex-end",

    gap:
      "10px",

    marginBottom:
      "14px",
  },


  smallAvatar: {

    width:
      "32px",

    height:
      "32px",

    minWidth:
      "32px",

    borderRadius:
      "12px",

    backgroundColor:
      "#0f172a",

    color:
      "#ffffff",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    fontSize:
      "11px",

    fontWeight:
      "900",
  },


  userMessageStack: {

    maxWidth:
      "76%",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "flex-end",
  },


  messageAttachment: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "9px",

    maxWidth:
      "100%",

    marginBottom:
      "7px",

    padding:
      "9px 12px",

    backgroundColor:
      "#ffffff",

    border:
      "1px solid #dbe4ef",

    borderRadius:
      "14px",

    boxShadow:
      "0 6px 14px rgba(15, 23, 42, 0.06)",
  },


  messageAttachmentIcon: {

    fontSize:
      "17px",
  },


  messageAttachmentInfo: {

    display:
      "flex",

    flexDirection:
      "column",

    minWidth:
      0,
  },


  messageAttachmentName: {

    maxWidth:
      "300px",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

    color:
      "#0f172a",

    fontSize:
      "13px",

    fontWeight:
      "800",
  },


  messageAttachmentType: {

    marginTop:
      "2px",

    color:
      "#64748b",

    fontSize:
      "10px",

    fontWeight:
      "700",

    textTransform:
      "capitalize",
  },


  messageBubble: {

    maxWidth:
      "76%",

    borderRadius:
      "18px",

    padding:
      "13px 15px",

    fontSize:
      "14px",

    lineHeight:
      1.55,

    whiteSpace:
      "pre-wrap",

    wordBreak:
      "break-word",
  },


  userBubble: {

    backgroundColor:
      "#0f172a",

    color:
      "#ffffff",

    borderTopRightRadius:
      "6px",

    boxShadow:
      "0 8px 18px rgba(15, 23, 42, 0.16)",
  },


  assistantBubble: {

    backgroundColor:
      "#ffffff",

    color:
      "#334155",

    border:
      "1px solid #e2e8f0",

    borderTopLeftRadius:
      "6px",
  },


  typingDot: {

    color:
      "#0f172a",

    fontSize:
      "12px",
  },


  typingText: {

    color:
      "#64748b",

    fontStyle:
      "italic",
  },


  inputArea: {

    padding:
      "18px 24px",

    borderTop:
      "1px solid #e2e8f0",

    backgroundColor:
      "#ffffff",

    display:
      "flex",

    gap:
      "10px",
  },


  inputWrapper: {

    flex:
      1,

    display:
      "flex",

    alignItems:
      "center",

    backgroundColor:
      "#f8fafc",

    border:
      "1px solid #cbd5e1",

    borderRadius:
      "16px",

    paddingLeft:
      "6px",

    minWidth:
      0,
  },


  attachmentButton: {

    width:
      "42px",

    height:
      "42px",

    minWidth:
      "42px",

    border:
      "none",

    borderRadius:
      "12px",

    backgroundColor:
      "transparent",

    color:
      "#334155",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    cursor:
      "pointer",

    padding:
      0,
  },


  activeDocumentPill: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "5px",

    flexShrink:
      0,

    marginRight:
      "4px",

    padding:
      "5px 7px 5px 9px",

    backgroundColor:
      "#e2e8f0",

    borderRadius:
      "10px",
  },


  activeDocumentLabel: {

    color:
      "#475569",

    fontSize:
      "11px",

    fontWeight:
      "800",

    whiteSpace:
      "nowrap",
  },


  activeDocumentRemove: {

    width:
      "20px",

    height:
      "20px",

    border:
      "none",

    borderRadius:
      "6px",

    backgroundColor:
      "transparent",

    color:
      "#64748b",

    cursor:
      "pointer",

    fontSize:
      "16px",

    lineHeight:
      1,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    padding:
      0,
  },


  documentStatusArea: {

    padding:
      "10px 48px 0",

    backgroundColor:
      "#ffffff",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "flex-end",
  },


  documentChip: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "10px",

    width:
      "fit-content",

    maxWidth:
      "100%",

    backgroundColor:
      "#f8fafc",

    border:
      "1px solid #dbe4ef",

    borderRadius:
      "14px",

    padding:
      "9px 10px",
  },


  documentIcon: {

    fontSize:
      "18px",
  },


  documentInfo: {

    display:
      "flex",

    flexDirection:
      "column",

    minWidth:
      0,
  },


  documentName: {

    maxWidth:
      "300px",

    overflow:
      "hidden",

    textOverflow:
      "ellipsis",

    whiteSpace:
      "nowrap",

    color:
      "#0f172a",

    fontSize:
      "13px",

    fontWeight:
      "800",
  },


  documentType: {

    marginTop:
      "2px",

    color:
      "#64748b",

    fontSize:
      "10px",

    fontWeight:
      "700",

    textTransform:
      "capitalize",
  },


  removeDocumentButton: {

    width:
      "26px",

    height:
      "26px",

    border:
      "none",

    borderRadius:
      "8px",

    backgroundColor:
      "#e2e8f0",

    color:
      "#475569",

    cursor:
      "pointer",

    fontSize:
      "18px",

    lineHeight:
      1,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",
  },


  documentError: {

    color:
      "#b91c1c",

    backgroundColor:
      "#fef2f2",

    border:
      "1px solid #fecaca",

    borderRadius:
      "12px",

    padding:
      "9px 12px",

    fontSize:
      "12px",

    lineHeight:
      1.45,
  },


  input: {

    flex:
      1,

    minWidth:
      0,

    border:
      "none",

    borderRadius:
      "16px",

    padding:
      "14px 10px",

    fontSize:
      "15px",

    outline:
      "none",

    color:
      "#0f172a",

    backgroundColor:
      "transparent",
  },


  sendButton: {

    backgroundColor:
      "#0f172a",

    color:
      "#ffffff",

    border:
      "none",

    borderRadius:
      "16px",

    padding:
      "0 24px",

    fontSize:
      "15px",

    fontWeight:
      "900",

    cursor:
      "pointer",
  },


  fallbackPanel: {

    width:
      "100%",

    maxWidth:
      "520px",

    margin:
      "0 auto",

    backgroundColor:
      "#ffffff",

    border:
      "1px solid #e2e8f0",

    borderRadius:
      "24px",

    padding:
      "34px",

    boxShadow:
      "0 20px 45px rgba(15, 23, 42, 0.08)",

    textAlign:
      "center",
  },


  fallbackTitle: {

    margin:
      "18px 0 8px",

    fontSize:
      "28px",

    fontWeight:
      "900",

    color:
      "#0f172a",
  },


  fallbackText: {

    margin:
      "0 0 24px",

    color:
      "#64748b",

    fontSize:
      "15px",

    lineHeight:
      1.6,
  },


  primaryButton: {

    backgroundColor:
      "#0f172a",

    color:
      "#ffffff",

    border:
      "none",

    borderRadius:
      "14px",

    padding:
      "13px 20px",

    fontSize:
      "15px",

    fontWeight:
      "900",

    cursor:
      "pointer",
  },
};