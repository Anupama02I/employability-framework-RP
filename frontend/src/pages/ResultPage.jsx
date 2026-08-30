import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import logo from "../assets/logo.jpeg";

const messages = [
  "How can I prepare for job interviews?",
  "What careers match my strengths?",
  "Explain my results in more detail.",
  "Help me create a career roadmap."
];

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const employabilityProfile =
    state?.employabilityProfile ||
    JSON.parse(sessionStorage.getItem("employabilityProfile") || "null");
  const resultData = state?.status
    ? state
    : employabilityProfile
      ? {
          status: employabilityProfile.predictionResult,
          probability: employabilityProfile.predictionProbability,
          positive_factors: employabilityProfile.shapPositiveFactors || [],
          negative_factors: employabilityProfile.shapNegativeFactors || [],
          recommendations: employabilityProfile.diceRecommendations || []
        }
      : null;
  const isEmployable = resultData?.status === "employable";
  const percentage = parseFloat(resultData?.probability || "0");
  const [displayText, setDisplayText] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const currentMessage = messages[msgIndex];
    let timeout;

    if (charIndex < currentMessage.length) {
      timeout = setTimeout(() => {
        setDisplayText((prev) => prev + currentMessage[charIndex]);
        setCharIndex(charIndex + 1);
      }, 40);
    } else {
      timeout = setTimeout(() => {
        setDisplayText("");
        setCharIndex(0);
        setMsgIndex((prev) => (prev + 1) % messages.length);
      }, 2000);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, msgIndex]);

  // =========================
  // LOGIC (Preserved Exactly)
  // =========================
  if (!resultData) {
    return (
      <div style={styles.loadingWrapper}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          style={styles.loaderIcon}
        >✦</motion.div>
        <h2 style={styles.loadingText}>No data available</h2>
        <button style={styles.backButton} onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  const getTargetLevel = (text) => {
    const match = text.match(/to\s(\d+)/);
    if (!match) return "Improvement needed";
    const value = parseInt(match[1]);
    if (value === 5) return "Excellent level proficiency";
    if (value === 4) return "Good level proficiency";
    if (value === 3) return "Moderate level proficiency";
    if (value === 2) return "Basic level improvement";
    if (value === 1) return "Initial level improvement";
    return "Improvement needed";
  };

  // =========================
  // UI RENDER
  // =========================
  return (
    <div style={styles.pageWrapper}>
      {/* GLOBAL HEADER */}
      <div style={styles.headerNav}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          <img src={logo} alt="logo" style={styles.headerLogo} />
          <span>Employability AI Assistant</span>
        </div>
      </div>

      
      <main style={styles.mainContainer}>
        {/* HEADER SECTION */}
        <header style={styles.reportHeader}>
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            style={styles.badgeRow}
    >
            <div style={styles.botAvatar}>AI</div>

            <div style={styles.badge}>
               CAREER SNAPSHOT
            </div>
          </motion.div>
          <h1 style={styles.mainTitle}>Your Career Insights</h1>
          <p style={styles.mainSubtitle}>
            This analysis is generated on your skills and career readiness indicators.
          </p>
        </header>

        <div style={styles.reportGrid}>
          
          {/* SECTION 1: EPS SCORE PANEL */}
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.scorePanel}
          >
            <div style={styles.panelLabel}>EMPLOYABILITY STATUS</div>
            <div style={statusBadge(isEmployable)}>
              {isEmployable ? "✓ Employable" : "⚠ Not employable"}
            </div>

            <div style={styles.circleContainer}>
              <div style={{
                ...styles.circleOuter,
                background: `conic-gradient(#4f46e5 ${percentage}%, #f1f5f9 ${percentage}%)`
              }}>
                <div style={styles.circleInner}>
                  <div style={styles.circleNumber}>
                    {Math.round(percentage)}<span style={styles.percentSign}>%</span>
                  </div>
                  <div style={styles.circleLabel}>ERS Score</div>
                </div>
              </div>
            </div>
            
            <p style={styles.panelDescription}>
              Your <strong>Employability Readiness Score</strong> reflects your current market readiness according to AI’s predictive modeling.
            </p>
          </motion.section>

          {/* SECTION 2: AI REASONING (SHAP) */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={styles.reasoningPanel}
          >
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>AI Explanation of Your Score</h2>
              <p style={styles.panelSubtitleSmall}>These factors show how your skills influenced the AI model’s decision.</p>
            </div>

            <div style={styles.factorsList}>
              {resultData.positive_factors.length > 0 && (
                <div style={styles.factorGroup}>
                  <h4 style={styles.factorHeading}>Factors Improving Your Score</h4>
                  {resultData.positive_factors.map((f, i) => (
                    <motion.div 
                      whileHover={{ x: 5 }}
                      key={i} 
                      style={styles.factorCardGreen}
                    >
                      <div style={styles.iconCircleGreen}>↑</div>
                      <span style={{ flex: 1, fontWeight: '500' }}>{f}</span>
                      <span style={styles.impactLabelGreen}>Positive Impact</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {resultData.negative_factors.length > 0 && (
                <div style={styles.factorGroup}>
                  <h4 style={styles.factorHeading}>Factors Reducing Your Score</h4>
                  {resultData.negative_factors.map((f, i) => (
                    <motion.div 
                      whileHover={{ x: 5 }}
                      key={i} 
                      style={styles.factorCardRed}
                    >
                      <div style={styles.iconCircleRed}>↓</div>
                      <span style={{ flex: 1, fontWeight: '500' }}>{f}</span>
                      <span style={styles.impactLabelRed}>Negative Impact</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>

          {/* SECTION 3: IMPROVEMENT GUIDANCE */}
          <section style={styles.recommendationPanel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Minimum Changes to Achieve Employability</h2>
              <p style={styles.panelSubtitleSmall}>These are the smallest changes needed to move your prediction into the employable category</p>
            </div>

            <div style={styles.recList}>
              {resultData.recommendations.length > 0 ? (
                resultData.recommendations.map((r, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.1 }} 
                    key={i} 
                    style={styles.recCard}
                    whileHover={{ y: -5, boxShadow: "0 12px 20px rgba(0,0,0,0.05)" }}
                  >
                    <div style={styles.recIcon}>✦</div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.recText}>{r}</div>
                      <div style={styles.recTarget}>
                        Level Objective: <span style={styles.targetHighlight}>{getTargetLevel(r)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={styles.successState}>
                  <span style={{ fontSize: '32px' }}>🏆</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '18px' }}>You are already employable!</div>
                    <div style={{ opacity: 0.9, fontSize: '15px' }}>Continue improving to unlock greater career opportunities</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: CONVERSATIONAL BRIDGE */}
          <section style={styles.bridgeSection}>
            <div style={styles.bridgeContent}>
              <div style={styles.messageBubble}>
                <div style={styles.bubbleHeader}>
                  <div style={styles.botAvatar}>AI</div>
                  <h3 style={styles.bubbleTitle}>Shall we discuss the next steps?</h3>
                </div>
                <p style={styles.bubbleBody}>
                  I'm here to help you navigate your results. We can dive deeper into specific skill strategies or simulate an interview based on your profile.
                </p>
                
                <div style={styles.suggestionBox}>
                  <span style={styles.suggestionLabel}>Try asking me:</span>
                  <div style={styles.typingPreview}>
                    <span style={{ color: '#4f46e5' }}>“</span>{displayText}<span style={styles.cursorPill}></span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#312e81" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    navigate("/chat", {
                      state: { employabilityProfile },
                    })
                  }
                  style={styles.continueCTA}
                >
                  Continue the Conversation
                  <span style={{ marginLeft: '12px', fontSize: '18px' }}>→</span>
                </motion.button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// =========================
// PREMIUM STYLES
// =========================
const styles = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#fcfdfe",
    color: "#0f172a",
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: "100px"
  },
  headerNav: {
    width: "100%",
    maxWidth: "1100px",
    padding: "24px",
    display: "flex",
    justifyContent: "flex-start",
  },
  logo: { display: "flex", alignItems: "center", gap: "10px", fontWeight: "700", fontSize: "18px", color: "#0f172a", cursor: "pointer" },
  headerLogo: { width: "24px", height: "24px", objectFit: "contain", borderRadius: "6px" },
  mainContainer: { width: "100%", maxWidth: "1100px", padding: "0 24px" },
  reportHeader: { textAlign: "center", margin: "40px 0 60px" },
  badge: { 
    display: "inline-block", 
    padding: "6px 14px", 
    borderRadius: "20px", 
    backgroundColor: "#eff6ff", 
    color: "#2563eb", 
    fontSize: "11px", 
    fontWeight: "700", 
    textTransform: "uppercase", 
    letterSpacing: "0.05em", 
    marginBottom: "16px",
    border: "1px solid #dbeafe"
  },
  mainTitle: { fontSize: "42px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em", marginBottom: "12px" },
  mainSubtitle: { fontSize: "18px", color: "#475569", maxWidth: "650px", margin: "0 auto", lineHeight: "1.6" },

  reportGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" },

  // PANELS
  scorePanel: { 
    gridColumn: "span 4", 
    backgroundColor: "#fff", 
    border: "1px solid #e2e8f0", 
    borderRadius: "32px", 
    padding: "40px 32px", 
    textAlign: "center", 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
  },
  reasoningPanel: { 
    gridColumn: "span 8", 
    backgroundColor: "#fff", 
    border: "1px solid #e2e8f0", 
    borderRadius: "32px", 
    padding: "40px 32px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
  },
  recommendationPanel: { 
    gridColumn: "span 12", 
    backgroundColor: "#f8fafc", 
    border: "1px solid #e2e8f0", 
    borderRadius: "32px", 
    padding: "48px" 
  },

  bridgeSection: { gridColumn: "span 12", marginTop: "40px" },
  bridgeContent: { maxWidth: "800px", margin: "0 auto" },
  botAvatar: {
    width: "32px",
    height: "32px",
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "800"
  },
  messageBubble: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    padding: "40px",
    borderRadius: "32px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05)",
    background: "linear-gradient(to bottom right, #ffffff, #fcfdfe)"
  },
  bubbleHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  bubbleTitle: { fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.01em" },
  bubbleBody: { fontSize: "16px", color: "#475569", lineHeight: "1.6", marginBottom: "28px" },
  
  suggestionBox: {
    backgroundColor: "#f1f5f9",
    padding: "18px 22px",
    borderRadius: "18px",
    marginBottom: "32px",
    border: "1px solid #e2e8f0"
  },
  suggestionLabel: { fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "8px", display: "block" },
  typingPreview: { fontSize: "15px", fontWeight: "500", color: "#0f172a" },
  cursorPill: { display: "inline-block", width: "2px", height: "14px", backgroundColor: "#4f46e5", marginLeft: "4px", verticalAlign: "middle" },
  
  continueCTA: {
    width: "100%",
    backgroundColor: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "18px",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.2)"
  },

  panelLabel: { fontSize: "12px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" },
  panelTitle: { fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" },
  panelSubtitleSmall: { fontSize: "15px", color: "#64748b", marginBottom: "28px" },
  
  circleContainer: { margin: "32px 0" },
  circleOuter: { width: "200px", height: "200px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.4s ease" },
  circleInner: { width: "160px", height: "160px", borderRadius: "50%", backgroundColor: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" },
  circleNumber: { fontSize: "48px", fontWeight: "900", color: "#0f172a", lineHeight: 1 },
  percentSign: { fontSize: "20px", color: "#4f46e5", fontWeight: "700" },
  circleLabel: { fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginTop: "4px" },
  
  panelDescription: { fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginTop: "12px" },
  factorsList: { display: "flex", flexDirection: "column", gap: "28px" },
  factorGroup: { display: "flex", flexDirection: "column", gap: "10px" },
  factorHeading: { fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.05em" },
  
  factorCardGreen: { display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "16px", fontSize: "15px", color: "#166534" },
  factorCardRed: { display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", backgroundColor: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: "16px", fontSize: "15px", color: "#991b1b" },
  
  iconCircleGreen: { width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800" },
  iconCircleRed: { width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#f43f5e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800" },
  
  impactLabelGreen: { fontSize: "10px", fontWeight: "800", color: "#15803d", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: "10px" },
  impactLabelRed: { fontSize: "10px", fontWeight: "800", color: "#b91c1c", backgroundColor: "#fee2e2", padding: "2px 8px", borderRadius: "10px" },
  
  recList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" },
  recCard: { display: "flex", gap: "18px", padding: "28px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "24px" },
  recIcon: { fontSize: "20px", color: "#4f46e5" },
  recText: { fontSize: "17px", fontWeight: "700", color: "#0f766e", marginBottom: "4px" },
  recTarget: { fontSize: "13px", color: "#64748b" },
  targetHighlight: { color: "#4f46e5", fontWeight: "700" },
  
  successState: { gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "20px", padding: "32px", backgroundColor: "#0f172a", color: "#fff", borderRadius: "24px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)" },
  loadingWrapper: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  loaderIcon: { fontSize: "40px", color: "#4f46e5", marginBottom: "20px" },
  loadingText: { fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "24px" },
  backButton: { padding: "14px 28px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "14px", cursor: "pointer", fontWeight: "700" }
};

const statusBadge = (isEmployable) => ({
  display: "inline-block",
  padding: "6px 14px",
  borderRadius: "20px",
  backgroundColor: isEmployable ? "#0f172a" : "#fff1f2",
  color: isEmployable ? "#ffffff" : "#f43f5e",
  fontSize: "11px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  border: isEmployable ? "none" : "1px solid #ffe4e6"
});
