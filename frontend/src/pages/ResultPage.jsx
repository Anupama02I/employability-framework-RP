import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { motion } from "framer-motion";

import html2pdf from "html2pdf.js";

import logo from "../assets/logo.jpeg";

import {
  translations,
} from "../data/questions";

import {
  getSavedEmployabilityProfile,
} from "../services/predictionStorage";

import {
  getOccupationDetails,
  searchOccupations,
} from "../services/api";


// ============================================================
// RESULT PAGE CONFIGURATION
// ============================================================

const SELF_ASSESSMENT_SKILLS = [
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
];


// Keep this aligned with the current ChatbotPage filtering rules.
const SKILL_AND_ABILITY_FEATURES = new Set([
  ...SELF_ASSESSMENT_SKILLS,
  "english_communication",
  "digital_confidence",
]);


const RATING_LABELS = {
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


const RESULT_TEXT = {
  en: {
    pageBadge: "ASSESSMENT RESULT",
    pageTitle: "Your Employability Insights",
    pageSubtitle:
      "Review your employment outcome, the factors that influenced it, your self-assessed skill profile, and occupational skill information.",
    outcomeTitle: "Employability Outcome",
    outcomeSubtitle: "Based on the answers you provided",
    meaningTitle:
      "What this means",
    positiveMeaning:
      "Your assessment profile showed patterns associated with a positive employment outcome in this model. This is an assessment insight, not a guarantee of employment.",
    negativeMeaning:
      "Your assessment profile showed areas that may benefit from further development. Review the influencing factors and your self-assessed skill profile for additional insight.",
    influenceTitle: "What Influenced This Result",
    positiveInfluence:
      "These strong self-rated capability areas contributed in the same direction as your positive outcome.",
    negativeInfluence:
      "These lower self-rated capability areas contributed in the same direction as the result and may be useful areas to strengthen.",
    noInfluence:
      "No clear user-facing skill factor met the display criteria for this result.",
    personalDetailsNote:
      "Background and demographic information may be used internally by the model, but it is not presented here as a personal strength, weakness, or recommendation.",
    skillProfileTitle: "Self-Assessment Skill Profile",
    skillProfileSubtitle:
      "This section reflects only the 10 skill ratings you provided during the assessment. It is not a separate prediction.",
    exploreTitle: "Explore Occupations & Skills",
    exploreSubtitle:
      "Search an occupation you are interested in and explore the skills associated with it. These are informational profiles, not personalized job recommendations.",
    searchPlaceholder: "Search an occupation, e.g. data analyst",
    searchButton: "Search",
    featuredTitle: "Featured Occupations",
    resultsTitle: "Search Results",
    essentialSkills: "Essential skills and knowledge",
    optionalSkills: "Optional skills and knowledge",
    viewDetails: "View Details",
    noResults: "No matching occupation was found. Try another occupation title.",
    loading: "Loading occupation information...",
    sourceNote:
      "Source: European Commission ESCO v1.2.1. ESCO provides general occupational information.",
    close: "Close",
    escoSource: "Open source",
    downloadPdf: "Download PDF",
    retake: "Retake Assessment",
    continueChat: "Continue to Career Guidance Chat",
    noData: "No assessment result is available.",
    startAssessment: "Start Assessment",
  },
  si: {
    pageBadge: "ඇගයීමේ ප්‍රතිඵලය",
    pageTitle: "ඔබගේ රැකියා හැකියාව පිළිබඳ අවබෝධය",
    pageSubtitle:
      "රැකියා ප්‍රතිඵලය, එයට බලපෑ සාධක, ඔබගේ ස්වයං ඇගයූ කුසලතා සහ වෘත්තීය කුසලතා තොරතුරු බලන්න.",
    outcomeTitle: "රැකියා හැකියාව ප්‍රතිඵලය",
    outcomeSubtitle: "ඔබ ලබා දුන් පිළිතුරු මත පදනම්ව",
    meaningTitle:
     "මෙයින් අදහස් වන්නේ කුමක්ද?",
    positiveMeaning:
      "ඔබගේ ඇගයීම් පැතිකඩ ආකෘතිය තුළ ධනාත්මක රැකියා ප්‍රතිඵලයක් සමඟ සම්බන්ධ වූ රටා පෙන්වයි. මෙය ඇගයීම් අවබෝධයක් පමණක් වන අතර රැකියාවක් ලැබීමේ සහතිකයක් නොවේ.",
    negativeMeaning:
      "ඔබගේ ඇගයීම් පැතිකඩ තුළ තවදුරටත් ශක්තිමත් කළ හැකි ක්ෂේත්‍ර තිබෙන බව පෙනේ. වැඩි අවබෝධයක් සඳහා ප්‍රතිඵලයට බලපෑ සාධක සහ ඔබගේ ස්වයං ඇගයූ කුසලතා පැතිකඩ සලකා බලන්න.",
    influenceTitle: "මෙම ප්‍රතිඵලයට බලපෑ සාධක",
    positiveInfluence:
      "මෙම ශක්තිමත් ස්වයං ඇගයූ හැකියා ඔබගේ ධනාත්මක ප්‍රතිඵලයට එකම දිශාවෙන් දායක විය.",
    negativeInfluence:
      "මෙම අඩු ස්වයං ඇගයූ හැකියා මෙම ප්‍රතිඵලයට එකම දිශාවෙන් දායක වූ අතර වැඩිදියුණු කළ හැකි ක්ෂේත්‍ර විය හැක.",
    noInfluence:
      "මෙම ප්‍රතිඵලය සඳහා පෙන්වීමේ නියමයන් සපුරාලන පැහැදිලි කුසලතා සාධකයක් නොමැත.",
    personalDetailsNote:
      "පසුබිම් සහ ජනගහන තොරතුරු ආකෘතිය තුළ භාවිතා විය හැකි නමුත් ඒවා පුද්ගලික ශක්තියක්, දුර්වලතාවයක් හෝ නිර්දේශයක් ලෙස මෙහි පෙන්වන්නේ නැත.",
    skillProfileTitle: "ස්වයං ඇගයූ කුසලතා පැතිකඩ",
    skillProfileSubtitle:
      "මෙය ඔබ ඇගයීමේදී ලබා දුන් කුසලතා 10 ක ලකුණු පමණක් පෙන්වයි. මෙය වෙනම පුරෝකථනයක් නොවේ.",
    exploreTitle: "වෘත්තීන් සහ අවශ්‍ය කුසලතා සොයන්න",
    exploreSubtitle:
      "ඔබ කැමති වෘත්තියක් සොයා එයට සම්බන්ධ කුසලතා බලන්න. මෙය පුද්ගලික රැකියා නිර්දේශයක් නොවේ.",
    searchPlaceholder: "වෘත්තියක් සොයන්න, උදා: data analyst",
    searchButton: "සොයන්න",
    featuredTitle: "තෝරාගත් වෘත්තීන්",
    resultsTitle: "සෙවුම් ප්‍රතිඵල",
    essentialSkills: "අත්‍යවශ්‍ය කුසලතා සහ දැනුම",
    optionalSkills: "අමතර කුසලතා සහ දැනුම",
    viewDetails: "විස්තර බලන්න",
    noResults: "ගැලපෙන වෘත්තියක් හමු නොවීය. වෙනත් වෘත්තීය නාමයක් උත්සාහ කරන්න.",
    loading: "වෘත්තීය තොරතුරු පූරණය වෙමින්...",
    sourceNote:
      "මූලාශ්‍රය: European Commission ESCO v1.2.1. ",
    close: "වසන්න",
    escoSource: "මූලාශ්‍රය විවෘත කරන්න",
    downloadPdf: "PDF බාගන්න",
    retake: "නැවත ඇගයීම කරන්න",
    continueChat: "වෘත්තීය මාර්ගෝපදේශ සංවාදයට යන්න",
    noData: "ඇගයීමේ ප්‍රතිඵලයක් නොමැත.",
    startAssessment: "ඇගයීම ආරම්භ කරන්න",
  },
  ta: {
    pageBadge: "மதிப்பீட்டு முடிவு",
    pageTitle: "உங்கள் வேலைவாய்ப்பு பார்வைகள்",
    pageSubtitle:
      "வேலைவாய்ப்பு முடிவு, அதனை பாதித்த காரணிகள், உங்கள் சுயமதிப்பீட்டு திறன் சுயவிவரம் மற்றும் தொழில் திறன் தகவல்களைப் பார்க்கவும்.",
    outcomeTitle: "வேலைவாய்ப்பு முடிவு",
    outcomeSubtitle: "நீங்கள் வழங்கிய பதில்களின் அடிப்படையில்",
    meaningTitle:
      "இதன் பொருள் என்ன?",
    positiveMeaning:
      "உங்கள் மதிப்பீட்டு சுயவிவரம் ஆய்வு மாதிரியில் நேர்மறையான வேலைவாய்ப்பு முடிவுடன் தொடர்புடைய சில வடிவங்களை காட்டுகிறது. இது ஒரு மதிப்பீட்டு பார்வை மட்டுமே; வேலை கிடைக்கும் என்பதற்கான உத்தரவாதம் அல்ல.",
    negativeMeaning:
      "உங்கள் மதிப்பீட்டு சுயவிவரத்தில் மேலும் மேம்படுத்தக்கூடிய சில பகுதிகள் இருப்பதை முடிவு காட்டுகிறது. கூடுதல் புரிதலுக்கு முடிவை பாதித்த காரணிகளையும் உங்கள் சுயமதிப்பீட்டு திறன் சுயவிவரத்தையும் பார்க்கவும்.",
    influenceTitle: "இந்த முடிவை பாதித்த காரணிகள்",
    positiveInfluence:
      "இந்த வலுவான சுயமதிப்பீட்டு திறன்கள் உங்கள் நேர்மறை முடிவுடன் ஒரே திசையில் பங்களித்தன.",
    negativeInfluence:
      "இந்த குறைந்த சுயமதிப்பீட்டு திறன்கள் முடிவுடன் ஒரே திசையில் பங்களித்தன; அவை வளர்க்கக்கூடிய பகுதிகளாக இருக்கலாம்.",
    noInfluence:
      "இந்த முடிவிற்கு காட்ட வேண்டிய நிபந்தனைகளை பூர்த்தி செய்த தெளிவான திறன் காரணிகள் இல்லை.",
    personalDetailsNote:
      "பின்னணி மற்றும் மக்கள்தொகை தகவல்கள் மாதிரியில் உள்மையாக பயன்படுத்தப்படலாம்; ஆனால் அவை தனிப்பட்ட பலம், பலவீனம் அல்லது பரிந்துரையாக இங்கு காட்டப்படுவதில்லை.",
    skillProfileTitle: "சுயமதிப்பீட்டு திறன் சுயவிவரம்",
    skillProfileSubtitle:
      "இந்த பகுதி மதிப்பீட்டில் நீங்கள் வழங்கிய 10 திறன் மதிப்பீடுகளை மட்டுமே காட்டுகிறது. இது தனி கணிப்பு அல்ல.",
    exploreTitle: "தொழில்கள் மற்றும் தேவையான திறன்களை ஆராயுங்கள்",
    exploreSubtitle:
      "உங்களுக்கு விருப்பமான தொழிலைத் தேடி படி அதனுடன் தொடர்புடைய திறன்களைப் பாருங்கள். இவை தனிப்பயன் வேலை பரிந்துரைகள் அல்ல.",
    searchPlaceholder: "ஒரு தொழிலைத் தேடுங்கள், உதா: data analyst",
    searchButton: "தேடுங்கள்",
    featuredTitle: "தேர்ந்தெடுக்கப்பட்ட தொழில்கள்",
    resultsTitle: "தேடல் முடிவுகள்",
    essentialSkills: "அத்தியாவசிய திறன்கள் மற்றும் அறிவு",
    optionalSkills: "விருப்ப திறன்கள் மற்றும் அறிவு",
    viewDetails: "விவரங்களைப் பார்க்கவும்",
    noResults: "பொருந்தும் தொழில் கிடைக்கவில்லை. வேறு தொழில் பெயரை முயற்சிக்கவும்.",
    loading: "தொழில் தகவல் ஏற்றப்படுகிறது...",
    sourceNote:
      "மூலம்: European Commission ESCO v1.2.1. ",
    close: "மூடு",
    escoSource: "மூலத்தைத் திறக்கவும்",
    downloadPdf: "PDF பதிவிறக்கவும்",
    retake: "மதிப்பீட்டை மீண்டும் செய்யவும்",
    continueChat: "தொழில் வழிகாட்டல் உரையாடலுக்கு செல்லவும்",
    noData: "மதிப்பீட்டு முடிவு கிடைக்கவில்லை.",
    startAssessment: "மதிப்பீட்டை தொடங்கவும்",
  },
};


function getProfileFromRouteState(state) {
  if (!state) return null;

  return (
    state.employabilityProfile
    || state
  );
}


export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const assessmentPdfRef =
    useRef(null);

  const employabilityProfile = useMemo(
    () => (
      getProfileFromRouteState(state)
      || getSavedEmployabilityProfile()
    ),
    [state]
  );

  const selectedLanguage =
    employabilityProfile?.selectedLanguage
    || "en";

  const langData =
    translations[selectedLanguage]
    || translations.en;

  const text =
    RESULT_TEXT[selectedLanguage]
    || RESULT_TEXT.en;

  const [searchText, setSearchText] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [occupations, setOccupations] = useState([]);
  const [occupationsLoading, setOccupationsLoading] = useState(false);
  const [occupationsError, setOccupationsError] = useState("");
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  useEffect(() => {
    if (!employabilityProfile) return;

    loadOccupations("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employabilityProfile]);


  const loadOccupations = async (query) => {
    setOccupationsLoading(true);
    setOccupationsError("");

    try {
      const result = await searchOccupations(
        query,
        8
      );

      setOccupations(
        result?.occupations || []
      );
    }
    catch (error) {
      console.error(
        "Occupation explorer error:",
        error
      );

      setOccupations([]);
      setOccupationsError(
        "Occupation information is temporarily unavailable."
      );
    }
    finally {
      setOccupationsLoading(false);
    }
  };


  const handleOccupationSearch = async (event) => {
    event.preventDefault();

    const query = searchText.trim();

    setSubmittedSearch(query);
    await loadOccupations(query);
  };


  const handleViewDetails = async (occupation) => {
    setDetailsLoading(true);
    setSelectedOccupation(null);

    try {
      const details = await getOccupationDetails(
        occupation.esco_code
      );

      setSelectedOccupation(details);
    }
    catch (error) {
      console.error(
        "Occupation detail error:",
        error
      );

      setOccupationsError(
        "Unable to load the selected occupation details."
      );
    }
    finally {
      setDetailsLoading(false);
    }
  };


  if (!employabilityProfile) {
    return (
      <div style={styles.centerPage}>
        <img
          src={logo}
          alt="logo"
          style={styles.emptyLogo}
        />

        <h2 style={styles.emptyTitle}>
          {text.noData}
        </h2>

        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => navigate("/")}
        >
          {text.startAssessment}
        </button>
      </div>
    );
  }


  const predictionResult =
    employabilityProfile.predictionResult
    || "";

  const friendlyPrediction =
    langData?.statusLabels?.[predictionResult]
    || predictionResult
    || "Unknown";

  const isPositiveOutcome =
    predictionResult
    === "positive_employment_outcome";

  const isNegativeOutcome =
    predictionResult
    === "negative_employment_outcome";

  const candidateInfluenceFactors =
    isPositiveOutcome
      ? (
          employabilityProfile.shapPositiveFactors
          || []
        )
      : isNegativeOutcome
        ? (
            employabilityProfile.shapNegativeFactors
            || []
          )
        : [];

  const visibleInfluenceFactors =
    candidateInfluenceFactors
      .filter((factor) => {
        if (
          !factor
          || !SKILL_AND_ABILITY_FEATURES.has(
            factor.feature_key
          )
        ) {
          return false;
        }

        const rating = Number(
          factor.value
        );

        if (!Number.isFinite(rating)) {
          return false;
        }

        if (isPositiveOutcome) {
          return rating >= 4 && rating <= 5;
        }

        if (isNegativeOutcome) {
          return rating >= 1 && rating <= 2;
        }

        return false;
      })
      .slice(0, 3);

  const assessmentAnswers =
    employabilityProfile.userAssessmentAnswers
    || {};

  const ratingLabels =
    RATING_LABELS[selectedLanguage]
    || RATING_LABELS.en;


  // ============================================================
  // DOWNLOAD ASSESSMENT RESULT AS PDF
  // ============================================================

  const handleDownloadAssessmentPdf = () => {
    if (!assessmentPdfRef.current) {
      return;
    }

    const options = {
      margin: 10,

      filename:
        "Employability_Assessment_Result.pdf",

      image: {
        type: "jpeg",
        quality: 0.98,
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
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
      .set(options)
      .from(assessmentPdfRef.current)
      .save();
  };


  return (
    <div style={styles.pageWrapper}>
      <header style={styles.headerNav}>
        <button
          type="button"
          style={styles.logoButton}
          onClick={() => navigate("/")}
        >
          <img
            src={logo}
            alt="logo"
            style={styles.headerLogo}
          />

          <span>
            Employability Assessment Assistant
          </span>
        </button>
      </header>


      <main style={styles.mainContainer}>
        <div ref={assessmentPdfRef}>
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.heroSection}
        >
          <div style={styles.heroBadge}>
            {text.pageBadge}
          </div>

          <h1 style={styles.mainTitle}>
            {text.pageTitle}
          </h1>

          <p style={styles.mainSubtitle}>
            {text.pageSubtitle}
          </p>
        </motion.section>


        {/* ==================================================
            OUTCOME + INFLUENCING FACTORS
        ================================================== */}

        <section style={styles.topGrid}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.outcomeCard}
          >
            <p style={styles.eyebrow}>
              {text.outcomeTitle}
            </p>

             <p style={styles.outcomeDescription}>
              {text.outcomeSubtitle}
            </p>

            <div
              style={{
                ...styles.outcomePill,
                ...(isPositiveOutcome
                  ? styles.positiveOutcomePill
                  : styles.negativeOutcomePill),
              }}
            >
              {friendlyPrediction}
            </div>

           

            <div
              style={{
                ...styles.meaningBox,
                ...(isPositiveOutcome
                 ? styles.positiveMeaningBox
                  : styles.negativeMeaningBox),
              }}
            >

              <div
                style={{
                  ...styles.meaningIcon,
                  ...(isPositiveOutcome
                    ? styles.positiveMeaningIcon
                    : styles.negativeMeaningIcon),
                }}
              >
                {isPositiveOutcome ? "✓" : "i"}
              </div>


             <div style={styles.meaningContent}>

                <h3 style={styles.meaningTitle}>
                  {text.meaningTitle}
                </h3>

                <p style={styles.meaningText}>
                  {
                    isPositiveOutcome
                     ? text.positiveMeaning
                      : text.negativeMeaning
                  }
                </p>

              </div>

            </div>
          </motion.div>


          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={styles.panel}
          >
            <div style={styles.sectionHeaderRow}>
              <div>
                <p style={styles.eyebrow}>
                  MODEL EXPLANATION
                </p>

                <h2 style={styles.sectionTitle}>
                  {text.influenceTitle}
                </h2>
              </div>
            </div>

            <p style={styles.sectionText}>
              {
                isPositiveOutcome
                  ? text.positiveInfluence
                  : text.negativeInfluence
              }
            </p>

            {
              visibleInfluenceFactors.length > 0
              ? (
                  <div style={styles.factorList}>
                    {
                      visibleInfluenceFactors.map(
                        (factor, index) => {
                          const label =
                            langData?.featureLabels?.[
                              factor.feature_key
                            ]
                            || factor.feature_key;

                          const rating = Number(
                            factor.value
                          );

                          return (
                            <div
                              key={`${factor.feature_key}-${index}`}
                              style={styles.factorCard}
                            >
                              <div>
                                <div style={styles.factorName}>
                                  {label}
                                </div>

                                <div style={styles.factorRatingLabel}>
                                  {
                                    ratingLabels[rating]
                                    || `${rating}/5`
                                  }
                                </div>
                              </div>

                              <div style={styles.factorScore}>
                                {rating}/5
                              </div>
                            </div>
                          );
                        }
                      )
                    }
                  </div>
                )
              : (
                  <div style={styles.emptyNotice}>
                    {text.noInfluence}
                  </div>
                )
            }

            <div style={styles.infoNotice}>
              {text.personalDetailsNote}
            </div>
          </motion.div>
        </section>


        {/* ==================================================
            SELF-ASSESSMENT SKILL PROFILE
        ================================================== */}

        <section style={styles.sectionBlock}>
          <div style={styles.sectionIntro}>
            <p style={styles.eyebrow}>
              YOUR INPUTS
            </p>

            <h2 style={styles.sectionTitleLarge}>
              {text.skillProfileTitle}
            </h2>

            <p style={styles.sectionSubtitle}>
              {text.skillProfileSubtitle}
            </p>
          </div>

          <div style={styles.skillsGrid}>
            {
              SELF_ASSESSMENT_SKILLS.map(
                (featureKey) => {
                  const value = Number(
                    assessmentAnswers[featureKey]
                  );

                  const safeValue =
                    Number.isFinite(value)
                    ? Math.max(1, Math.min(5, value))
                    : 0;

                  const label =
                    langData?.featureLabels?.[featureKey]
                    || featureKey;

                  return (
                    <div
                      key={featureKey}
                      style={styles.skillCard}
                    >
                      <div style={styles.skillCardHeader}>
                        <span style={styles.skillName}>
                          {label}
                        </span>

                        <span style={styles.skillValue}>
                          {safeValue ? `${safeValue}/5` : "—"}
                        </span>
                      </div>

                      <div style={styles.skillTrack}>
                        <div
                          style={{
                            ...styles.skillFill,
                            width: `${(safeValue / 5) * 100}%`,
                          }}
                        />
                      </div>

                      <div style={styles.skillRatingWord}>
                        {
                          safeValue
                            ? ratingLabels[safeValue]
                            : ""
                        }
                      </div>
                    </div>
                  );
                }
              )
            }
          </div>
        </section>
        </div>


        {/* ==================================================
            OCCUPATION & SKILLS EXPLORER
        ================================================== */}

        <section style={styles.sectionBlock}>
          <div style={styles.sectionIntro}>
            <p style={styles.eyebrow}>
              OCCUPATION INFORMATION
            </p>

            <h2 style={styles.sectionTitleLarge}>
              {text.exploreTitle}
            </h2>

            <p style={styles.sectionSubtitle}>
              {text.exploreSubtitle}
            </p>
          </div>


          <form
            onSubmit={handleOccupationSearch}
            style={styles.searchRow}
          >
            <div style={styles.searchInputWrap}>
              <span style={styles.searchIcon}>
                ⌕
              </span>

              <input
                type="text"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder={text.searchPlaceholder}
                style={styles.searchInput}
                aria-label={text.searchPlaceholder}
              />
            </div>

            <button
              type="submit"
              style={styles.searchButton}
              disabled={occupationsLoading}
            >
              {text.searchButton}
            </button>
          </form>


          <div style={styles.explorerHeadingRow}>
            <h3 style={styles.explorerHeading}>
              {
                submittedSearch
                  ? text.resultsTitle
                  : text.featuredTitle
              }
            </h3>

            {
              submittedSearch
              ? (
                  <span style={styles.searchQueryText}>
                    “{submittedSearch}”
                  </span>
                )
              : null
            }
          </div>


          {
            occupationsLoading
            ? (
                <div style={styles.loadingBox}>
                  {text.loading}
                </div>
              )
            : occupationsError
              ? (
                  <div style={styles.errorBox}>
                    {occupationsError}
                  </div>
                )
              : occupations.length === 0
                ? (
                    <div style={styles.emptyNotice}>
                      {text.noResults}
                    </div>
                  )
                : (
                    <div style={styles.occupationGrid}>
                      {
                        occupations.map(
                          (occupation) => (
                            <motion.article
                              whileHover={{ y: -4 }}
                              transition={{ duration: 0.15 }}
                              key={occupation.esco_code}
                              style={styles.occupationCard}
                            >
                              <div style={styles.occupationSourceBadge}>
                                ESCO
                              </div>

                              <h3 style={styles.occupationTitle}>
                                {occupation.occupation_name}
                              </h3>

                              <p style={styles.occupationDescription}>
                                {occupation.description}
                              </p>

                              <div style={styles.skillChipWrap}>
                                {
                                  (occupation.essential_skills || [])
                                    .map((skill) => (
                                      <span
                                        key={skill}
                                        style={styles.skillChip}
                                      >
                                        {skill}
                                      </span>
                                    ))
                                }
                              </div>

                              {
                                occupation.essential_skill_count > 5
                                ? (
                                    <div style={styles.moreSkillsText}>
                                      + {
                                        occupation.essential_skill_count
                                - (occupation.essential_skills || []).length
                                      } more essential skills
                                    </div>
                                  )
                                : null
                              }

                              <button
                                type="button"
                                style={styles.detailsButton}
                                onClick={() =>
                                  handleViewDetails(occupation)
                                }
                              >
                                {text.viewDetails}
                                <span aria-hidden="true">→</span>
                              </button>
                            </motion.article>
                          )
                        )
                      }
                    </div>
                  )
          }


          <div style={styles.sourceNotice}>
            {text.sourceNote}
          </div>
        </section>


        {/* ==================================================
            ACTIONS
        ================================================== */}

        <section style={styles.actionSection}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleDownloadAssessmentPdf}
          >
            ↓{" "}
            {text.downloadPdf}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => navigate("/")}
          >
            {text.retake}
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              navigate(
                "/chat",
                {
                  state: {
                    employabilityProfile,
                  },
                }
              )
            }
          >
            {text.continueChat}
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>


      {/* ====================================================
          OCCUPATION DETAIL MODAL
      ==================================================== */}

      {
        detailsLoading
        ? (
            <div style={styles.modalBackdrop}>
              <div style={styles.modalLoadingCard}>
                {text.loading}
              </div>
            </div>
          )
        : selectedOccupation
          ? (
              <div
                style={styles.modalBackdrop}
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setSelectedOccupation(null);
                  }
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={styles.modalCard}
                >
                  <div style={styles.modalHeader}>
                    <div>
                      <div style={styles.occupationSourceBadge}>
                        ESCO · {selectedOccupation.esco_code}
                      </div>

                      <h2 style={styles.modalTitle}>
                        {selectedOccupation.occupation_name}
                      </h2>
                    </div>

                    <button
                      type="button"
                      style={styles.closeButton}
                      onClick={() =>
                        setSelectedOccupation(null)
                      }
                      aria-label={text.close}
                    >
                      ×
                    </button>
                  </div>

                  <p style={styles.modalDescription}>
                    {selectedOccupation.description}
                  </p>

                  <div style={styles.modalSection}>
                    <h3 style={styles.modalSectionTitle}>
                      {text.essentialSkills}
                    </h3>

                    <div style={styles.modalSkillGrid}>
                      {
                        (selectedOccupation.essential_skills || [])
                          .map((skill) => (
                            <span
                              key={skill}
                              style={styles.modalSkillChip}
                            >
                              {skill}
                            </span>
                          ))
                      }
                    </div>
                  </div>

                  {
                    (selectedOccupation.optional_skills || []).length > 0
                    ? (
                        <div style={styles.modalSection}>
                          <h3 style={styles.modalSectionTitle}>
                            {text.optionalSkills}
                          </h3>

                          <div style={styles.modalSkillGrid}>
                            {
                              selectedOccupation.optional_skills
                                .map((skill) => (
                                  <span
                                    key={skill}
                                    style={styles.optionalSkillChip}
                                  >
                                    {skill}
                                  </span>
                                ))
                            }
                          </div>
                        </div>
                      )
                    : null
                  }

                  <div style={styles.modalFooter}>
                    {
                      selectedOccupation.occupation_uri
                      ? (
                          <a
                            href={selectedOccupation.occupation_uri}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.sourceLink}
                          >
                            {text.escoSource}
                          </a>
                        )
                      : <span />
                    }

                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() =>
                        setSelectedOccupation(null)
                      }
                    >
                      {text.close}
                    </button>
                  </div>
                </motion.div>
              </div>
            )
          : null
      }
    </div>
  );
}


const styles = {
  pageWrapper: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    paddingBottom: "72px",
  },

  headerNav: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "24px 24px 0",
  },

  logoButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "16px",
    fontWeight: 750,
    color: "#0f172a",
    cursor: "pointer",
  },

  headerLogo: {
    width: "30px",
    height: "30px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  mainContainer: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "0 24px",
    boxSizing: "border-box",
  },

  heroSection: {
    textAlign: "center",
    padding: "56px 0 42px",
  },

  heroBadge: {
    display: "inline-flex",
    padding: "7px 14px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    border: "1px solid #c7d2fe",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: "16px",
  },

  mainTitle: {
    margin: "0 0 12px",
    fontSize: "clamp(32px, 5vw, 48px)",
    lineHeight: 1.08,
    letterSpacing: "-0.035em",
  },

  mainSubtitle: {
    maxWidth: "790px",
    margin: "0 auto",
    color: "#64748b",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "22px",
    alignItems: "stretch",
  },

  outcomeCard: {
    background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
    border: "1px solid #e2e8f0",
    borderRadius: "26px",
    padding: "30px",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.05)",
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "26px",
    padding: "30px",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.05)",
  },

  eyebrow: {
    margin: "0 0 10px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  outcomePill: {
  alignSelf: "center",
  borderRadius: "16px",
  padding: "14px 22px",
  fontSize: "22px",
  lineHeight: 1.35,
  fontWeight: 800,
  textAlign: "center",
  marginTop: "96px",
  },

  positiveOutcomePill: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },

  negativeOutcomePill: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
  },

  outcomeDescription: {
    color: "#64748b",
    lineHeight: 1.6,
    margin: "16px 0 0",
  },

  meaningBox: {
  marginTop: "118px",

  padding: "18px",

  borderRadius: "18px",

  display: "flex",

  alignItems: "flex-start",

  gap: "14px",

  border: "1px solid #e2e8f0",
},

positiveMeaningBox: {
  background:
    "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",

  border:
    "1px solid #bbf7d0",
},

negativeMeaningBox: {
  background:
    "linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)",

  border:
    "1px solid #fed7aa",
},

meaningIcon: {
  width: "36px",

  height: "36px",

  minWidth: "36px",

  borderRadius: "12px",

  display: "grid",

  placeItems: "center",

  fontSize: "17px",

  fontWeight: 900,
},

positiveMeaningIcon: {
  background: "#d1fae5",

  color: "#047857",
},

negativeMeaningIcon: {
  background: "#ffedd5",

  color: "#c2410c",
},

meaningContent: {
  flex: 1,
},

meaningTitle: {
  margin: "1px 0 6px",

  fontSize: "15px",

  fontWeight: 800,

  color: "#0f172a",
},

meaningText: {
  margin: 0,

  fontSize: "14px",

  lineHeight: 1.65,

  color: "#475569",
},

  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "24px",
    letterSpacing: "-0.02em",
  },

  sectionText: {
    margin: "10px 0 20px",
    color: "#64748b",
    lineHeight: 1.65,
  },

  factorList: {
    display: "grid",
    gap: "10px",
  },

  factorCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "15px 16px",
    borderRadius: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  factorName: {
    fontWeight: 750,
    color: "#1e293b",
  },

  factorRatingLabel: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#64748b",
  },

  factorScore: {
    flexShrink: 0,
    background: "#eef2ff",
    color: "#4338ca",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "13px",
    fontWeight: 800,
  },

  infoNotice: {
    marginTop: "16px",
    borderRadius: "14px",
    padding: "12px 14px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  emptyNotice: {
    padding: "18px",
    borderRadius: "16px",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    background: "#ffffff",
    lineHeight: 1.6,
  },

  sectionBlock: {
    marginTop: "28px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "26px",
    padding: "32px",
    boxShadow: "0 12px 40px rgba(15, 23, 42, 0.04)",
  },

  sectionIntro: {
    maxWidth: "820px",
    marginBottom: "24px",
  },

  sectionTitleLarge: {
    margin: 0,
    fontSize: "28px",
    letterSpacing: "-0.025em",
  },

  sectionSubtitle: {
    margin: "10px 0 0",
    color: "#64748b",
    lineHeight: 1.65,
  },

  skillsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "14px",
  },

  skillCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "16px",
    background: "#fcfdff",
  },

  skillCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },

  skillName: {
    fontWeight: 700,
    color: "#1e293b",
    lineHeight: 1.4,
  },

  skillValue: {
    flexShrink: 0,
    fontSize: "13px",
    fontWeight: 800,
    color: "#4338ca",
  },

  skillTrack: {
    height: "8px",
    marginTop: "14px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },

  skillFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
  },

  skillRatingWord: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#64748b",
  },

  searchRow: {
    display: "flex",
    gap: "10px",
    marginTop: "6px",
  },

  searchInputWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "0 14px",
    background: "#ffffff",
  },

  searchIcon: {
    color: "#64748b",
    fontSize: "22px",
    lineHeight: 1,
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "14px 0",
    fontSize: "15px",
    color: "#0f172a",
    minWidth: 0,
  },

  searchButton: {
    border: "none",
    borderRadius: "16px",
    padding: "0 22px",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },

  explorerHeadingRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "28px 0 14px",
  },

  explorerHeading: {
    margin: 0,
    fontSize: "18px",
  },

  searchQueryText: {
    color: "#64748b",
    fontSize: "14px",
  },

  occupationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },

  occupationCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    minHeight: "310px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.035)",
  },

  occupationSourceBadge: {
    alignSelf: "flex-start",
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.05em",
  },

  occupationTitle: {
    margin: "14px 0 8px",
    fontSize: "19px",
    lineHeight: 1.3,
    letterSpacing: "-0.015em",
  },

  occupationDescription: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.55,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  skillChipWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "16px",
  },

  skillChip: {
    display: "inline-flex",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "11px",
    lineHeight: 1.2,
  },

  moreSkillsText: {
    marginTop: "10px",
    fontSize: "11px",
    color: "#64748b",
  },

  detailsButton: {
    marginTop: "auto",
    paddingTop: "18px",
    border: "none",
    background: "transparent",
    color: "#4338ca",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sourceNotice: {
    marginTop: "20px",
    padding: "14px 16px",
    borderRadius: "15px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  loadingBox: {
    padding: "24px",
    borderRadius: "16px",
    background: "#f8fafc",
    color: "#64748b",
    textAlign: "center",
  },

  errorBox: {
    padding: "18px",
    borderRadius: "16px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
  },

  actionSection: {
    marginTop: "28px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    borderRadius: "14px",
    padding: "13px 18px",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },

  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 18px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: 750,
    cursor: "pointer",
  },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.56)",
    display: "grid",
    placeItems: "center",
    zIndex: 1000,
    padding: "24px",
    overflowY: "auto",
  },

  modalCard: {
    width: "min(900px, 100%)",
    maxHeight: "88vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)",
  },

  modalLoadingCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px 30px",
    color: "#475569",
    fontWeight: 700,
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
  },

  modalTitle: {
    margin: "12px 0 0",
    fontSize: "30px",
    letterSpacing: "-0.025em",
  },

  closeButton: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#475569",
    fontSize: "24px",
    cursor: "pointer",
    lineHeight: 1,
  },

  modalDescription: {
    margin: "18px 0 0",
    color: "#475569",
    lineHeight: 1.7,
  },

  modalSection: {
    marginTop: "24px",
  },

  modalSectionTitle: {
    margin: "0 0 12px",
    fontSize: "17px",
  },

  modalSkillGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  modalSkillChip: {
    display: "inline-flex",
    padding: "8px 10px",
    borderRadius: "11px",
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: "12px",
    lineHeight: 1.3,
  },

  optionalSkillChip: {
    display: "inline-flex",
    padding: "8px 10px",
    borderRadius: "11px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "12px",
    lineHeight: 1.3,
  },

  modalFooter: {
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },

  sourceLink: {
    color: "#4338ca",
    fontWeight: 750,
    textDecoration: "none",
  },

  centerPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "24px",
    background: "#f8fafc",
    textAlign: "center",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  emptyLogo: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    objectFit: "cover",
  },

  emptyTitle: {
    margin: 0,
    color: "#0f172a",
  },
};
