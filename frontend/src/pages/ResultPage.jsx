import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.jpeg";



export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
  window.scrollTo(0, 0);
}, []);

  // =========================
  // LOGIC (Preserved Exactly)
  // =========================
  if (!state) {
    return (
      <div style={styles.loadingWrapper}>
        <h2 style={styles.loadingText}>No data available</h2>
        <button style={styles.backButton} onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  const isEmployable = state.status === "employable";
  const percentage = parseFloat(state.probability);

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

  // Updated messages for the conversational bridge
  const messages = [
    "How can I prepare for  job interviews?",
    "What careers match my strengths?",
    "Explain my results in more detail.",
    "Help me create a career roadmap."
  ];

  const [displayText, setDisplayText] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentMessage = messages[msgIndex];
    if (charIndex < currentMessage.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + currentMessage[charIndex]);
        setCharIndex(charIndex + 1);
      }, 40);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => {
        setDisplayText("");
        setCharIndex(0);
        setMsgIndex((prev) => (prev + 1) % messages.length);
      }, 2000);
    }
  }, [charIndex, msgIndex]);

  // =========================
  // UI RENDER
  // =========================
  return (
    <div style={styles.pageWrapper}>
      {/* GLOBAL HEADER */}
      <div style={styles.headerNav}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          <img
            src={logo}
            alt="logo"
            style={styles.headerLogo}
          />
          <span>Employability AI Assistant</span>
        </div>
      </div>

      <main style={styles.mainContainer}>
        {/* HEADER SECTION */}
        <header style={styles.reportHeader}>
          <div style={styles.badge}>Career Snapshot</div>
          <h1 style={styles.mainTitle}>Your Career Insights</h1>
          <p style={styles.mainSubtitle}>
            This analysis is generated based on your skills and career readiness indicators.
          </p>
        </header>

        <div style={styles.reportGrid}>
          
          {/* SECTION 1: EPS SCORE PANEL */}
          <section style={styles.scorePanel}>
            <div style={styles.panelLabel}>Employability Status</div>
            <div style={statusBadge(isEmployable)}>
              {isEmployable ? "✓ Employable" : "⚠ Not Employable"}
            </div>

            <div style={styles.circleContainer}>
              <div style={{
                ...styles.circleOuter,
                background: `conic-gradient(#111827 ${percentage}%, #f3f4f6 ${percentage}%)`
              }}>
                <div style={styles.circleInner}>
                  <div style={styles.circleNumber}>{Math.round(percentage)}<span style={{ fontSize: '20px' }}>%</span></div>
                  <div style={styles.circleLabel}>EPS Score</div>
                </div>
              </div>
            </div>
            
            <p style={styles.panelDescription}>
              Your <strong>Employability Probability Score</strong> indicates your likelihood of securing employment based on your current skills and qualifications.
            </p>
          </section>

          {/* SECTION 2: AI REASONING (SHAP) */}
          <section style={styles.reasoningPanel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>AI Explanation of Your Score</h2>
              <p style={styles.panelSubtitleSmall}>These factors show how your skills influenced the AI model’s decision.</p>
            </div>

            <div style={styles.factorsList}>
              {state.positive_factors.length > 0 && (
                <div style={styles.factorGroup}>
                  <h4 style={styles.factorHeading}>Strength Indicators</h4>
                  {state.positive_factors.map((f, i) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} style={styles.factorCardGreen}>
                      <span style={styles.factorDotGreen}></span>
                      <span style={{ flex: 1 }}>{f}</span>
                      <span style={styles.impactLabel}>Positive Impact</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {state.negative_factors.length > 0 && (
                <div style={styles.factorGroup}>
                  <h4 style={styles.factorHeading}>Factors Reducing Your Score</h4>
                  {state.negative_factors.map((f, i) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} style={styles.factorCardRed}>
                      <span style={styles.factorDotRed}></span>
                      <span style={{ flex: 1 }}>{f}</span>
                      <span style={styles.impactLabel}>Negative Impact</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: IMPROVEMENT GUIDANCE */}
          <section style={styles.recommendationPanel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Minimum Changes to Achieve Employability</h2>
              <p style={styles.panelSubtitleSmall}>These are the smallest changes needed to move your prediction into the employable category</p>
            </div>

            <div style={styles.recList}>
              {state?.recommendations?.length > 0 ? (
                state.recommendations.map((r, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} style={styles.recCard}>
                    <div style={styles.recIcon}>✦</div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.recText}>{r}</div>
                      <div style={styles.recTarget}>
                        Targeting: <span style={{ color: '#111827', fontWeight: '600' }}>{getTargetLevel(r)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={styles.successState}>
                  <span style={{ fontSize: '24px' }}>🏆</span>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>You are already employable!</div>
                    <div style={{ opacity: 0.8, fontSize: '14px' }}>Continue improving to unlock greater career opportunities.</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: CONVERSATIONAL CONTINUATION (Bridge to Chat) */}
          <section style={styles.bridgeSection}>
            <div style={styles.bridgeContent}>
              
              
              <div style={styles.messageBubble}>
                <h3 style={styles.bubbleTitle}>Shall we discuss the next steps?</h3>
                <p style={styles.bubbleBody}>
                  Continue the conversation for personalized career guidance and AI-powered insights.
                </p>
                
                <div style={styles.suggestionBox}>
                  <span style={styles.suggestionLabel}>Try asking me:</span>
                  <div style={styles.typingPreview}>
                    "{displayText}"<span style={styles.cursorPill}></span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#1f2937" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/chat")}
                  style={styles.continueCTA}
                >
                  Continue the Conversation
                  <span style={{ marginLeft: '10px' }}>→</span>
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
// STYLES
// =========================
const styles = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#ffffff",
    color: "#111827",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: "120px"
  },
  headerNav: {
    width: "100%",
    maxWidth: "1100px",
    padding: "24px",
    display: "flex",
    justifyContent: "flex-start",
  },
  logo: { display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "19px", color: "#111827", cursor: "pointer" },
  logoIcon: { color: "#111827", fontSize: "22px" },

  headerLogo: {
  width: "20px",
  height: "20px",
  objectFit: "contain",
  borderRadius: "4px"
  },

  mainContainer: { width: "100%", maxWidth: "1100px", padding: "0 24px" },
  reportHeader: { textAlign: "center", margin: "40px 0 60px" },
  badge: { display: "inline-block", padding: "5px 14px", borderRadius: "20px", backgroundColor: "#f3f4f6", color: "#4b5563", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" },
  mainTitle: { fontSize: "42px", fontWeight: "800", color: "#111827", letterSpacing: "-0.04em", marginBottom: "12px" },
  mainSubtitle: { fontSize: "18px", color: "#6b7280", maxWidth: "600px", margin: "0 auto", lineHeight: "1.5" },

  reportGrid: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" },

  // PANELS
  scorePanel: { gridColumn: "span 4", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "28px", padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  reasoningPanel: { gridColumn: "span 8", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "28px", padding: "32px" },
  recommendationPanel: { gridColumn: "span 12", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "28px", padding: "40px" },

  // CONVERSATIONAL BRIDGE (NEW)
  bridgeSection: {
    gridColumn: "span 12",
    marginTop: "40px",
    paddingTop: "60px",
    borderTop: "1px solid #f1f5f9",
  },
  bridgeContent: {
    maxWidth: "800px",
    margin: "0 auto",
    display: "flex",
    gap: "24px",
    alignItems: "flex-start"
  },
  assistantAvatar: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px"
  },
  botIconLarge: {
    width: "56px",
    height: "56px",
    backgroundColor: "#111827",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "24px"
  },
  onlineStatus: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#10b981",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  pulseDot: {
    width: "6px",
    height: "6px",
    backgroundColor: "#10b981",
    borderRadius: "50%",
    animation: "pulse 2s infinite"
  },
  messageBubble: {
    flex: 1,
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    padding: "32px",
    borderRadius: "0 28px 28px 28px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
  },
  bubbleTitle: { fontSize: "20px", fontWeight: "800", color: "#111827", marginBottom: "12px", letterSpacing: "-0.01em" },
  bubbleBody: { fontSize: "16px", color: "#4b5563", lineHeight: "1.6", marginBottom: "24px" },
  
  suggestionBox: {
    backgroundColor: "#f9fafb",
    padding: "16px 20px",
    borderRadius: "16px",
    marginBottom: "32px",
    border: "1px solid #f1f5f9"
  },
  suggestionLabel: { fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", marginBottom: "8px", display: "block" },
  typingPreview: { fontSize: "15px", fontWeight: "500", color: "#111827", fontStyle: "italic" },
  cursorPill: { display: "inline-block", width: "2px", height: "14px", backgroundColor: "#111827", marginLeft: "4px", animation: "blink 1s infinite" },
  
  continueCTA: {
    width: "100%",
    backgroundColor: "#111827",
    color: "#fff",
    border: "none",
    padding: "18px",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },

  // PREVIOUS PANEL SUB-STYLES
  panelLabel: { fontSize: "14px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" },
  panelTitle: { fontSize: "22px", fontWeight: "800", color: "#111827", marginBottom: "4px" },
  panelSubtitleSmall: { fontSize: "14px", color: "#6b7280", marginBottom: "24px" },
  circleContainer: { margin: "32px 0" },
  circleOuter: { width: "180px", height: "180px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  circleInner: { width: "145px", height: "145px", borderRadius: "50%", backgroundColor: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  circleNumber: { fontSize: "42px", fontWeight: "800", color: "#111827" },
  circleLabel: { fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" },
  panelDescription: { fontSize: "14px", color: "#6b7280", lineHeight: "1.6", marginTop: "12px" },
  factorsList: { display: "flex", flexDirection: "column", gap: "24px" },
  factorHeading: { fontSize: "13px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", marginBottom: "12px" },
  factorCardGreen: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", backgroundColor: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "14px", fontSize: "15px", color: "#166534" },
  factorCardRed: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "14px", fontSize: "15px", color: "#991b1b" },
  factorDotGreen: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" },
  factorDotRed: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" },
  impactLabel: { fontSize: "11px", fontWeight: "700", opacity: 0.7 },
  recList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" },
  recCard: { display: "flex", gap: "16px", padding: "24px", backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "20px" },
  recIcon: { fontSize: "20px", color: "#111827" },
  recText: { fontSize: "16px", fontWeight: "700", color: "#111827" },
  recTarget: { fontSize: "13px", color: "#6b7280", marginTop: "4px" },
  successState: { gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "16px", padding: "30px", backgroundColor: "#111827", color: "#fff", borderRadius: "20px" },
  loadingWrapper: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: "24px", fontWeight: "800", color: "#111827", marginBottom: "20px" },
  backButton: { padding: "12px 24px", backgroundColor: "#111827", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600" }
};

const statusBadge = (isEmployable) => ({
  display: "inline-block",
  padding: "6px 14px",
  borderRadius: "20px",
  backgroundColor: isEmployable ? "#111827" : "#fef2f2",
  color: isEmployable ? "#ffffff" : "#ef4444",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase"
});