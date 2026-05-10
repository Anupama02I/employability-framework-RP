import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { analyzeUser } from "../services/api";
import { translations } from "../data/questions";
import logo from "../assets/logo.jpeg";

export default function InputPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  // =========================
  // STATE MGT (Preserved)
  // =========================
  const [language, setLanguage] = useState(null);
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    age: "",
    gender: "",
    field_of_study: "",
    Edu_Level: "",
    Skill_Analytical: "",
    Skill_Resilience: "",
    Skill_Leadership: "",
    Skill_Creative: "",
    Skill_Motivation: "",
    Skill_Tech_Literacy: "",
    Skill_Empathy: "",
    Skill_Curiosity: ""
  });
  const [loading, setLoading] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [typedDescription, setTypedDescription] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // NEW: History state to maintain the persistent conversation
  const [chatHistory, setChatHistory] = useState([]);

  const langData = language ? translations[language] : null;
  const questions = langData?.questions || [];
  const currentQuestion = questions[currentStep];

  // =========================
  // AUTO-SCROLL LOGIC
  // =========================
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [typedText, typedDescription, chatHistory, showOptions, showSubmit]);

  // =========================
  // TYPING EFFECT (Preserved Logic)
  // =========================
  useEffect(() => {
    if (!currentQuestion || !started) return;

    const fullQuestion = currentQuestion.question;
    const fullDescription = currentQuestion.description || "";

    setTypedText("");
    setTypedDescription("");
    setShowOptions(false);
    setShowSubmit(false);

    let questionIndex = 0;
    const questionInterval = setInterval(() => {
      questionIndex++;
      setTypedText(fullQuestion.slice(0, questionIndex));

      if (questionIndex >= fullQuestion.length) {
        clearInterval(questionInterval);
        let descIndex = 0;
        const descriptionInterval = setInterval(() => {
          descIndex++;
          setTypedDescription(fullDescription.slice(0, descIndex));
          if (descIndex >= fullDescription.length) {
            clearInterval(descriptionInterval);
            setTimeout(() => {
              setShowOptions(true);
            }, 400);
          }
        }, 12); 
      }
    }, 25);

    return () => clearInterval(questionInterval);
  }, [currentStep, started, currentQuestion]);

  // =========================
  // HANDLERS (Preserved Logic + History Update)
  // =========================
  const handleAnswer = (value) => {
    setIsTransitioning(true);
    // 1. Update the form state (Preserved)
    const updatedForm = { ...form, [currentQuestion.key]: value };
    setForm(updatedForm);

    // 2. Add current question and user's answer to history
    setChatHistory((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        description: currentQuestion.description,
        answer: value,
        key: currentQuestion.key
      }
    ]);

    if (currentStep === questions.length - 1) {
      setShowOptions(false);
      setTimeout(() => setShowSubmit(true), 800);
      return;
    }

    setShowOptions(false);
    setTimeout(() => {

      setCurrentStep((prev) => prev + 1);

      setTimeout(() => {
        setIsTransitioning(false);
    }, 50);

  }, 600);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const result = await analyzeUser(form);
      navigate("/result", { state: { ...result, language } });
    } catch (error) {
      alert("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SHARED UI COMPONENTS
  // =========================
  const Header = () => (
    <div style={styles.headerNav}>
      <div style={styles.logo}>
        <img
          src={logo}
          alt="logo"
          style={styles.headerLogo}
        />
        <span>Employability AI Assistant</span>
      </div>
      {language && started && !loading && (
        <div style={styles.miniProgress}>
          Step {currentStep + 1} of {questions.length}
        </div>
      )}
    </div>
  );

  // =========================
  // SCREENS
  // =========================

  if (!language) {
    return (
      <div style={styles.pageWrapper}>
        <Header />
        <main style={styles.mainContent}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            style={styles.heroSection}
          > 
            <img
              src={logo}
              alt="Employability AI"
              style={styles.centerLogo}
            />
            <div style={styles.badge}>Next-Gen Career Guidance</div>
            <h1 style={styles.mainTitle}>Unlock your professional potential with AI-powered career intelligence.</h1>
            <p style={styles.mainSubtitle}>Choose a language to start your personalized assessment.</p>
            
            <div style={styles.langGrid}>
              {[
                { id: 'en', label: 'English', sub: 'Global' },
                { id: 'si', label: 'සිංහල', sub: 'Sinhala' },
                { id: 'ta', label: 'தமிழ்', sub: 'Tamil' }
              ].map((l) => (
                <motion.button
                  key={l.id}
                  whileHover={{ y: -4, boxShadow: "0 12px 20px rgba(0,0,0,0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.langCard}
                  onClick={() => setLanguage(l.id)}
                >
                  <span style={styles.langLabel}>{l.label}</span>
                  <span style={styles.langSub}>{l.sub}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!started) {
    return (
      <div style={styles.pageWrapper}>
        <Header />
        <main style={styles.mainContent}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            style={styles.welcomeCard}
          >
            
            <h2 style={styles.welcomeTitle}>{langData.welcome}</h2>
            <p style={styles.welcomeText}>{langData.intro}</p>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "#4338ca" }}
              whileTap={{ scale: 0.98 }}
              style={styles.primaryButton}
              onClick={() => setStarted(true)}
            >
              {langData.start}
            </motion.button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.loadingContainer}>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={styles.loadingPulse}
          />
          <h2 style={styles.loadingText}>Analyzing Profile...</h2>
          <p style={styles.loadingSub}>Our AI is calculating your employability scores and generating insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <Header />
      
      {/* Top Sticky Progress Bar */}
      <div style={styles.topProgressContainer}>
        <motion.div 
          style={styles.topProgressBar}
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
        />
      </div>

      <main style={styles.chatContainer}>
        <div style={styles.messageList}>
          
          {/* 1. RENDER PERSISTENT HISTORY */}
          {chatHistory.map((item, idx) => (
            <div key={`history-${idx}`} style={styles.historyGroup}>
              {/* AI Question (Left) */}
              <div style={styles.aiMessageRow}>
                <div style={styles.botAvatar}>AI</div>
                <div style={styles.aiBubble}>
                  <h2 style={styles.questionTextSmall}>{item.question}</h2>
                  {item.description && <p style={styles.descriptionTextSmall}>{item.description}</p>}
                </div>
              </div>

              {/* User Answer (Right) */}
              <motion.div 
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                style={styles.userMessageRow}
              >
                <div style={styles.userBubble}>
                  {item.answer}
                </div>
              </motion.div>
            </div>
          ))}

          {/* 2. RENDER ACTIVE TYPING QUESTION (Left) */}
          {!showSubmit && !isTransitioning &&(
            <div style={styles.aiMessageRow}>
              <div style={styles.botAvatar}>AI</div>
              <div style={styles.aiBubble}>
                <h2 style={styles.questionText}>{typedText}</h2>
                {currentQuestion.description && (
                  <p style={styles.descriptionText}>{typedDescription}</p>
                )}
              </div>
            </div>
          )}

          {/* 3. INTERACTION AREA (Answer Chips) */}
          <div style={styles.interactionArea}>
            {currentQuestion.type === "choice" && showOptions && !showSubmit && (
              <div style={styles.optionsGrid}>
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, backgroundColor: "#f5f3ff", borderColor: "#6366f1" }}
                    whileTap={{ scale: 0.95 }}
                    style={styles.optionChip}
                    onClick={() => handleAnswer(option)}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            )}

            {currentQuestion.type === "rating" && showOptions && !showSubmit && (
              <div style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((num, index) => (
                  <motion.button
                    key={num}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, backgroundColor: "#f5f3ff", borderColor: "#6366f1" }}
                    whileTap={{ scale: 0.95 }}
                    style={styles.ratingChip}
                    onClick={() => handleAnswer(num)}
                  >
                    <span style={styles.ratingNum}>{num}</span>
                    <span style={styles.ratingLabel}>{currentQuestion.scaleLabels[index]}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {showSubmit && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                style={styles.finalActions}
              >
                <div style={styles.completionNotice}>
                  <span style={{ fontSize: '20px' }}></span>
                  <div>
                    <strong style={{ display: 'block', color: '#1e293b' }}>Perfect. I now have enough information</strong>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Ready to view your personalized employability analysis.</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  style={styles.primaryButton}
                  onClick={handleSubmit}
                >
                  {langData.finish}
                </motion.button>
              </motion.div>
            )}
          </div>
          
          {/* Dummy element for auto-scroll anchor */}
          <div ref={scrollRef} style={{ height: "40px" }} />
        </div>
      </main>
    </div>
  );
}

// =========================
// IMPROVED CONVERSATIONAL STYLES
// =========================
const styles = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    color: "#1e293b",
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  headerNav: {
    width: "100%",
    maxWidth: "800px",
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    backgroundColor: "rgba(249, 250, 251, 0.9)",
    backdropFilter: "blur(8px)",
    zIndex: 1000
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "700",
    fontSize: "16px",
    color: "#0f172a"
  },
  logoIcon: { color: "#4f46e5", fontSize: "20px" },
  miniProgress: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#fff",
    padding: "4px 12px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0"
  },
  headerLogo: {
  width: "20px",
  height: "20px",
  objectFit: "contain",
  borderRadius: "4px"
  },
  centerLogo: {
  width: "180px",
  height: "180px",
  objectFit: "contain",
  margin: "0 auto 24px",
  marginTop: "-80px",
  display: "block"
 },
  mainContent: {
    width: "100%",
    maxWidth: "800px",
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    flex: 1
  },
  heroSection: { textAlign: "center", maxWidth: "600px", margin: "0 auto" },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    backgroundColor: "#eef2ff",
    color: "#4f46e5",
    fontSize: "11px",
    fontWeight: "700",
    marginBottom: "16px",
    letterSpacing: "0.05em"
  },
  mainTitle: {
    fontSize: "36px",
    lineHeight: "1.2",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "16px",
    letterSpacing: "-0.02em"
  },
  mainSubtitle: {
    fontSize: "17px",
    color: "#475569",
    marginBottom: "40px",
    lineHeight: "1.5"
  },
  langGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
    width: "100%"
  },
  langCard: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    padding: "24px",
    borderRadius: "16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all 0.2s ease"
  },
  langLabel: { fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "4px" },
  langSub: { fontSize: "13px", color: "#94a3b8" },
  welcomeCard: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  botAvatarLarge: {
    width: "70px",
    height: "70px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    margin: "0 auto 24px"
  },
  welcomeTitle: { fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" },
  welcomeText: { fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "32px" },
  chatContainer: {
    width: "100%",
    maxWidth: "750px",
    padding: "20px 24px",
    paddingTop: "30px",
    flex: 1
  },
  topProgressContainer: {
    width: "100%",
    height: "3px",
    backgroundColor: "#e2e8f0",
    position: "fixed",
    top: "72px",
    left: 0,
    zIndex: 9999
  },
  topProgressBar: {
    height: "100%",
    backgroundColor: "#4f46e5",
    transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  messageList: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  historyGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  aiMessageRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    maxWidth: "85%"
  },
  userMessageRow: {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%"
  },
  botAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "#0f172a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
    flexShrink: 0
  },
  aiBubble: {
    backgroundColor: "#fff",
    padding: "16px 20px",
    borderRadius: "2px 18px 18px 18px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
    border: "1px solid #e2e8f0"
  },
  userBubble: {
    backgroundColor: "#6b7280",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: "18px 18px 2px 18px",
    fontSize: "15px",
    fontWeight: "500",
    maxWidth: "70%",
    boxShadow: "0 4px 12px rgba(107, 114, 128, 0.25)"
  },
  questionText: { fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.4", margin: 0 },
  questionTextSmall: { fontSize: "16px", fontWeight: "600", color: "#334155", lineHeight: "1.4", margin: 0 },
  descriptionText: { fontSize: "15px", color: "#475569", lineHeight: "1.5", marginTop: "8px", marginBottom: 0 },
  descriptionTextSmall: { fontSize: "14px", color: "#64748b", lineHeight: "1.5", marginTop: "4px", marginBottom: 0 },
  interactionArea: {
    paddingLeft: "44px",
    marginTop: "8px"
  },
  optionsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  optionChip: {
    backgroundColor: "#fff",
    border: "1px solid #d1d5db",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    color: "#4b5563",
    transition: "all 0.2s ease"
  },
  ratingRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  ratingChip: {
    backgroundColor: "#fff",
    border: "1px solid #d1d5db",
    padding: "10px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "70px",
    transition: "all 0.2s ease"
  },
  ratingNum: { fontSize: "16px", fontWeight: "700", color: "#4f46e5" },
  ratingLabel: { fontSize: "9px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" },
  finalActions: { width: "100%", marginTop: "10px" },
  completionNotice: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    marginBottom: "16px"
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  },
  loadingPulse: { width: "50px", height: "50px", backgroundColor: "#4f46e5", borderRadius: "15px", marginBottom: "20px" },
  loadingText: { fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" },
  loadingSub: { color: "#64748b", fontSize: "14px", maxWidth: "250px" }
};