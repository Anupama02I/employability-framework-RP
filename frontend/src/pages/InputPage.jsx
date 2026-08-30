import {
  useEffect,
  useRef,
  useState,
} from "react";

import { motion } from "framer-motion";

import { useNavigate } from "react-router-dom";

import { analyzeUser } from "../services/api";

import {
  translations,
  NO_TRAINING_VALUE,
} from "../data/questions";

import {
  saveEmployabilityProfile,
} from "../services/predictionStorage";

import logo from "../assets/logo.jpeg";


// ============================================================
// EXACT 26 MODEL B FEATURES
// ============================================================

const MODEL_FEATURES = [

  // Skills
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

  // Demographic
  "age",
  "gender",
  "marital_status",
  "household_size",

  // Education
  "education_level",
  "field_of_study",
  "time_since_studies",

  // Structural / capability
  "province",
  "digital_access",
  "english_communication",
  "digital_confidence",

  // Training
  "formal_training",
  "training_type",
  "training_field",
  "training_duration",
  "training_relevance",
];


// ============================================================
// TRAINING DETAIL FEATURES
// ============================================================

const TRAINING_DETAIL_FEATURES = [
  "training_type",
  "training_field",
  "training_duration",
  "training_relevance",
];


// ============================================================
// EMPTY FORM
// Exact 26 Model B fields
// ============================================================

const createEmptyForm = () => ({

  // Skills
  analytical_thinking: "",
  resilience_flexibility_agility: "",
  leadership_social_influence: "",
  creative_thinking: "",
  motivation_self_awareness: "",
  technological_literacy: "",
  empathy_active_listening: "",
  curiosity_lifelong_learning: "",
  talent_management: "",
  service_orientation: "",

  // Demographic
  age: "",
  gender: "",
  marital_status: "",
  household_size: "",

  // Education
  education_level: "",
  field_of_study: "",
  time_since_studies: "",

  // Structural / capability
  province: "",
  digital_access: "",
  english_communication: "",
  digital_confidence: "",

  // Training
  formal_training: "",
  training_type: "",
  training_field: "",
  training_duration: "",
  training_relevance: "",
});


// ============================================================
// SMALL INTERFACE TRANSLATIONS
// Used only by InputPage controls
// ============================================================

const uiText = {

  en: {
    step: "Step",
    continue: "Continue",
    invalidNumber:
      "Please enter a valid household size.",
    incomplete:
      "Some assessment information is missing. Please complete the assessment.",
    backendError:
      "Unable to connect to the employability analysis service. Please check that the backend is running and try again.",
  },

  si: {
    step: "පියවර",
    continue: "ඉදිරියට",
    invalidNumber:
      "කරුණාකර වලංගු ගෘහස්ථ සාමාජික සංඛ්‍යාවක් ඇතුළත් කරන්න.",
    incomplete:
      "ඇගයීමේ තොරතුරු කිහිපයක් අස්ථානගත වී ඇත. කරුණාකර ඇගයීම සම්පූර්ණ කරන්න.",
    backendError:
      "රැකියා හැකියාව විශ්ලේෂණ සේවාව සමඟ සම්බන්ධ වීමට නොහැකි විය. Backend සේවාව ක්‍රියාත්මකදැයි පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
  },

  ta: {
    step: "படி",
    continue: "தொடரவும்",
    invalidNumber:
      "சரியான குடும்ப உறுப்பினர் எண்ணிக்கையை உள்ளிடவும்.",
    incomplete:
      "மதிப்பீட்டின் சில தகவல்கள் விடுபட்டுள்ளன. மதிப்பீட்டை முழுமையாக முடிக்கவும்.",
    backendError:
      "வேலைவாய்ப்பு பகுப்பாய்வு சேவையுடன் இணைக்க முடியவில்லை. Backend இயங்குகிறதா என்பதை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
  },
};


// ============================================================
// COMPONENT
// ============================================================

export default function InputPage() {

  const navigate =
    useNavigate();

  const scrollRef =
    useRef(null);


  // ==========================================================
  // MAIN STATE
  // ==========================================================

  const [language, setLanguage] =
    useState(null);

  const [started, setStarted] =
    useState(false);

  const [currentStep, setCurrentStep] =
    useState(0);

  const [form, setForm] =
    useState(createEmptyForm);

  const [loading, setLoading] =
    useState(false);


  // ==========================================================
  // TYPING / INTERACTION STATE
  // ==========================================================

  const [typedText, setTypedText] =
    useState("");

  const [
    typedDescription,
    setTypedDescription,
  ] = useState("");

  const [showOptions, setShowOptions] =
    useState(false);

  const [showSubmit, setShowSubmit] =
    useState(false);

  const [
    isTransitioning,
    setIsTransitioning,
  ] = useState(false);


  // ==========================================================
  // CHAT-LIKE ASSESSMENT HISTORY
  //
  // IMPORTANT:
  //
  // form = canonical values for the ML model
  //
  // chatHistory = translated labels shown to user
  // ==========================================================

  const [chatHistory, setChatHistory] =
    useState([]);


  // ==========================================================
  // LANGUAGE DATA
  // ==========================================================

  const langData =
    language
      ? translations[language]
      : null;

  const questions =
    langData?.questions || [];

  const pageText =
    language
      ? uiText[language]
      : uiText.en;


  // ==========================================================
  // CONDITIONAL QUESTION FILTERING
  //
  // training_type, training_field,
  // training_duration and training_relevance
  // are shown ONLY when formal_training = Yes.
  // ==========================================================

  const getVisibleQuestions = (
    formState
  ) => {

    return questions.filter(
      (question) => {

        if (!question.showIf) {
          return true;
        }

        return (
          formState[
            question.showIf.key
          ]
          ===
          question.showIf.equals
        );
      }
    );
  };


  const visibleQuestions =
    getVisibleQuestions(form);


  const currentQuestion =
    visibleQuestions[currentStep];


  // ==========================================================
  // PROGRESS
  // ==========================================================

  const totalVisibleQuestions =
    visibleQuestions.length;


  const progressPercentage =
    showSubmit
      ? 100
      : totalVisibleQuestions > 0
        ? (
            (
              currentStep + 1
            )
            /
            totalVisibleQuestions
          )
          * 100
        : 0;


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(
    () => {

      if (scrollRef.current) {

        scrollRef.current.scrollIntoView({
          behavior: "smooth",
        });
      }

    },
    [
      typedText,
      typedDescription,
      chatHistory,
      showOptions,
      showSubmit,
    ]
  );


  // ==========================================================
  // TYPING EFFECT
  // Preserves your existing chatbot interaction style
  // ==========================================================

  useEffect(
    () => {

      if (
        !currentQuestion
        ||
        !started
        ||
        showSubmit
      ) {
        return;
      }


      const fullQuestion =
        currentQuestion.question || "";

      const fullDescription =
        currentQuestion.description || "";


      let questionInterval;
      let descriptionInterval;
      let showOptionsTimeout;


      // Clear interaction state for next question
      setTypedText("");
      setTypedDescription("");
      setShowOptions(false);


      const typingTimeout =
        setTimeout(
          () => {

            let questionIndex = 0;


            // ----------------------------------------------
            // Type question
            // ----------------------------------------------

            questionInterval =
              setInterval(
                () => {

                  questionIndex += 1;

                  setTypedText(
                    fullQuestion.slice(
                      0,
                      questionIndex
                    )
                  );


                  if (
                    questionIndex
                    >=
                    fullQuestion.length
                  ) {

                    clearInterval(
                      questionInterval
                    );


                    // --------------------------------------
                    // No description
                    // --------------------------------------

                    if (
                      !fullDescription
                    ) {

                      showOptionsTimeout =
                        setTimeout(
                          () => {
                            setShowOptions(
                              true
                            );
                          },
                          300
                        );

                      return;
                    }


                    // --------------------------------------
                    // Type description
                    // --------------------------------------

                    let descriptionIndex = 0;


                    descriptionInterval =
                      setInterval(
                        () => {

                          descriptionIndex += 1;


                          setTypedDescription(
                            fullDescription.slice(
                              0,
                              descriptionIndex
                            )
                          );


                          if (
                            descriptionIndex
                            >=
                            fullDescription.length
                          ) {

                            clearInterval(
                              descriptionInterval
                            );


                            showOptionsTimeout =
                              setTimeout(
                                () => {

                                  setShowOptions(
                                    true
                                  );

                                },
                                400
                              );
                          }

                        },
                        12
                      );
                  }

                },
                25
              );

          },
          0
        );


      return () => {

        clearTimeout(
          typingTimeout
        );

        clearInterval(
          questionInterval
        );

        clearInterval(
          descriptionInterval
        );

        clearTimeout(
          showOptionsTimeout
        );
      };

    },
    [
      currentStep,
      started,
      currentQuestion,
      showSubmit,
    ]
  );


  // ==========================================================
  // ANSWER HANDLER
  //
  // value:
  // canonical value stored for model
  //
  // displayAnswer:
  // translated value displayed in chat history
  // ==========================================================

  const handleAnswer = (
    value,
    displayAnswer = value
  ) => {

    if (
      !currentQuestion
      ||
      isTransitioning
    ) {
      return;
    }


    setIsTransitioning(true);


    // ========================================================
    // 1. Update canonical form
    // ========================================================

    const updatedForm = {
      ...form,
      [currentQuestion.key]:
        value,
    };


    // ========================================================
    // 2. Structural missingness:
    // formal_training = No
    //
    // Automatically provide the same value used during
    // model training for Q15-Q18.
    // ========================================================

    if (
      currentQuestion.key
      ===
      "formal_training"
    ) {

      if (value === "No") {

        TRAINING_DETAIL_FEATURES.forEach(
          (feature) => {

            updatedForm[feature] =
              NO_TRAINING_VALUE;
          }
        );

      } else if (value === "Yes") {

        // Defensive reset if the user previously selected No
        // and later changes to Yes in a future UI version.

        TRAINING_DETAIL_FEATURES.forEach(
          (feature) => {

            if (
              updatedForm[feature]
              ===
              NO_TRAINING_VALUE
            ) {

              updatedForm[feature] = "";
            }
          }
        );
      }
    }


    setForm(
      updatedForm
    );


    // ========================================================
    // 3. Add translated answer to chat-like history
    // ========================================================

    setChatHistory(
      (previousHistory) => [

        ...previousHistory,

        {
          question:
            currentQuestion.question,

          description:
            currentQuestion.description,

          answer:
            displayAnswer,

          canonicalValue:
            value,

          key:
            currentQuestion.key,
        },
      ]
    );


    // ========================================================
    // 4. Recalculate questions AFTER the answer
    //
    // Important for formal_training:
    //
    // Yes → add four training questions
    // No  → skip four training questions
    // ========================================================

    const nextVisibleQuestions =
      getVisibleQuestions(
        updatedForm
      );


    // ========================================================
    // 5. Last question
    // ========================================================

    if (
      currentStep
      ===
      nextVisibleQuestions.length - 1
    ) {

      setShowOptions(false);


      setTimeout(
        () => {

          setShowSubmit(
            true
          );

          setIsTransitioning(
            false
          );

        },
        800
      );

      return;
    }


    // ========================================================
    // 6. Move to next conversational question
    // ========================================================

    setShowOptions(
      false
    );


    setTimeout(
      () => {

        setCurrentStep(
          (previousStep) =>
            previousStep + 1
        );


        setTimeout(
          () => {

            setIsTransitioning(
              false
            );

          },
          50
        );

      },
      600
    );
  };


  // ==========================================================
  // FINAL SUBMIT
  // ==========================================================

  const handleSubmit = async () => {

    try {

      setLoading(
        true
      );


      // ======================================================
      // 1. Build exact Model B payload
      // ======================================================

      const modelPayload = {};


      MODEL_FEATURES.forEach(
        (feature) => {

          modelPayload[feature] =
            form[feature];
        }
      );


      // ======================================================
      // 2. Defensive structural-missingness handling
      // ======================================================

      if (
        modelPayload.formal_training
        ===
        "No"
      ) {

        TRAINING_DETAIL_FEATURES.forEach(
          (feature) => {

            modelPayload[feature] =
              NO_TRAINING_VALUE;
          }
        );
      }


      // ======================================================
      // 3. Validate completeness before API call
      // ======================================================

      const missingFeatures =
        MODEL_FEATURES.filter(
          (feature) => {

            const value =
              modelPayload[
                feature
              ];


            return (
              value === ""
              ||
              value === null
              ||
              value === undefined
            );
          }
        );


      if (
        missingFeatures.length > 0
      ) {

        console.error(
          "Missing Model B features:",
          missingFeatures
        );


        alert(
          pageText.incomplete
        );


        setLoading(
          false
        );

        return;
      }


      // ======================================================
      // 4. Call POST /analyze
      // ======================================================

      const result =
        await analyzeUser(
          modelPayload
        );


      // ======================================================
      // 5. Build language-neutral employability profile
      //
      // No probability
      // No EPS
      // No DiCE
      // No counterfactual recommendations
      // ======================================================

      const employabilityProfile = {

        selectedLanguage:
          language,


        // ----------------------------------------------
        // Model prediction
        // ----------------------------------------------

        predictionResult:
          result.status,

        predictedClass:
          result.predicted_class,


        // ----------------------------------------------
        // Local SHAP explanation
        // ----------------------------------------------

        shapPositiveFactors:
          result.positive_factors || [],

        shapNegativeFactors:
          result.negative_factors || [],


        // ----------------------------------------------
        // Canonical 26 Model B answers
        // ----------------------------------------------

        userAssessmentAnswers:
          modelPayload,


        // ----------------------------------------------
        // Translated conversational assessment history
        // ----------------------------------------------

        assessmentChatHistory:
          chatHistory,
      };


      // ======================================================
      // 6. Store assessment for continuing conversations
      // ======================================================

      saveEmployabilityProfile(
        employabilityProfile
      );


      // ======================================================
      // 7. Go directly to Career Guidance Chat
      //
      // ResultPage is intentionally skipped.
      // ======================================================

      navigate(
        "/chat",
        {
          state: {
            employabilityProfile,
          },
        }
      );

    }

    catch (error) {

      console.error(
        "Employability analysis error:",
        error
      );


      alert(
        pageText.backendError
      );
    }

    finally {

      setLoading(
        false
      );
    }
  };


  // ==========================================================
  // HEADER
  // ==========================================================

  const renderHeader = () => (

    <div style={styles.headerNav}>

      <div style={styles.logo}>

        <img
          src={logo}
          alt="logo"
          style={styles.headerLogo}
        />

        <span>
          Employability Assessment Assistant
        </span>

      </div>


      {
        language
        &&
        started
        &&
        !loading
        &&
        !showSubmit
        &&
        totalVisibleQuestions > 0
        && (

          <div style={styles.miniProgress}>

            {pageText.step}{" "}

            {Math.min(
              currentStep + 1,
              totalVisibleQuestions
            )}

            {" / "}

            {totalVisibleQuestions}

          </div>
        )
      }

    </div>
  );


  // ==========================================================
  // SCREEN 1
  // LANGUAGE SELECTION
  // ==========================================================

  if (!language) {

    return (

      <div style={styles.pageWrapper}>

        {renderHeader()}


        <main style={styles.mainContent}>

          <motion.div

            initial={{
              opacity: 0,
              y: 10,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            style={styles.heroSection}
          >

            <img
              src={logo}
              alt="Employability AI"
              style={styles.centerLogo}
            />


            <div style={styles.badge}>
              Next-Gen Career Guidance
            </div>


            <h1 style={styles.mainTitle}>

              Unlock your professional
              potential with AI-powered
              career intelligence.

            </h1>


            <p style={styles.mainSubtitle}>

              Choose a language to start
              your personalized assessment.

            </p>


            <div style={styles.langGrid}>

              {
                [
                  {
                    id: "en",
                    label: "English",
                    sub: "Global",
                  },

                  {
                    id: "si",
                    label: "සිංහල",
                    sub: "Sinhala",
                  },

                  {
                    id: "ta",
                    label: "தமிழ்",
                    sub: "Tamil",
                  },
                ].map(
                  (languageOption) => (

                    <motion.button

                      key={
                        languageOption.id
                      }

                      whileHover={{
                        y: -4,
                        boxShadow:
                          "0 12px 20px rgba(0,0,0,0.08)",
                      }}

                      whileTap={{
                        scale: 0.98,
                      }}

                      style={
                        styles.langCard
                      }

                      onClick={
                        () => {

                          setLanguage(
                            languageOption.id
                          );

                        }
                      }
                    >

                      <span
                        style={
                          styles.langLabel
                        }
                      >

                        {
                          languageOption.label
                        }

                      </span>


                      <span
                        style={
                          styles.langSub
                        }
                      >

                        {
                          languageOption.sub
                        }

                      </span>

                    </motion.button>
                  )
                )
              }

            </div>

          </motion.div>

        </main>

      </div>
    );
  }


  // ==========================================================
  // SCREEN 2
  // WELCOME
  // ==========================================================

  if (!started) {

    return (

      <div style={styles.pageWrapper}>

        {renderHeader()}


        <main style={styles.mainContent}>

          <motion.div

            initial={{
              opacity: 0,
              scale: 0.98,
            }}

            animate={{
              opacity: 1,
              scale: 1,
            }}

            style={styles.welcomeCard}
          >

            <h2 style={styles.welcomeTitle}>

              {langData.welcome}

            </h2>


            <p style={styles.welcomeText}>

              {langData.intro}

            </p>


            <motion.button

              whileHover={{
                scale: 1.02,
                backgroundColor:
                  "#4338ca",
              }}

              whileTap={{
                scale: 0.98,
              }}

              style={
                styles.primaryButton
              }

              onClick={
                () => {

                  setStarted(
                    true
                  );

                }
              }
            >

              {langData.start}

            </motion.button>


            <div
              style={
                styles.returningUserSection
              }
            >

              <p
                style={
                  styles.returningText
                }
              >

                {
                  langData.returningText
                }

              </p>


              <motion.button

                whileHover={{
                  x: 4,
                }}

                whileTap={{
                  scale: 0.98,
                }}

                style={
                  styles.conversationLink
                }

                onClick={
                  () =>
                    navigate("/chat")
                }
              >

                {
                  langData.continueConversation
                }

              </motion.button>

            </div>

          </motion.div>

        </main>

      </div>
    );
  }


  // ==========================================================
  // SCREEN 3
  // MODEL ANALYSIS LOADING
  // ==========================================================

  if (loading) {

    return (

      <div style={styles.pageWrapper}>

        <div
          style={
            styles.loadingContainer
          }
        >

          <motion.div

            animate={{

              scale: [
                1,
                1.1,
                1,
              ],

              opacity: [
                0.5,
                1,
                0.5,
              ],
            }}

            transition={{
              repeat: Infinity,
              duration: 2,
            }}

            style={
              styles.loadingPulse
            }
          />


          <h2
            style={
              styles.loadingText
            }
          >

            {
              langData.loadingTitle
            }

          </h2>


          <p
            style={
              styles.loadingSub
            }
          >

            {
              langData.loadingSubtitle
            }

          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // MAIN CONVERSATIONAL ASSESSMENT
  // ==========================================================

  return (

    <div style={styles.pageWrapper}>

      {renderHeader()}


      {/* =====================================================
          TOP STICKY PROGRESS BAR
      ====================================================== */}

      <div
        style={
          styles.topProgressContainer
        }
      >

        <motion.div

          style={
            styles.topProgressBar
          }

          initial={{
            width: 0,
          }}

          animate={{
            width:
              `${progressPercentage}%`,
          }}
        />

      </div>


      <main style={styles.chatContainer}>

        <div style={styles.messageList}>


          {/* =================================================
              1. PERSISTENT CHAT-LIKE HISTORY
          ================================================== */}

          {
            chatHistory.map(
              (
                item,
                index
              ) => (

                <div
                  key={
                    `history-${index}`
                  }
                  style={
                    styles.historyGroup
                  }
                >


                  {/* AI QUESTION — LEFT */}

                  <div
                    style={
                      styles.aiMessageRow
                    }
                  >

                    <div
                      style={
                        styles.botAvatar
                      }
                    >
                      AI
                    </div>


                    <div
                      style={
                        styles.aiBubble
                      }
                    >

                      <h2
                        style={
                          styles.questionTextSmall
                        }
                      >

                        {
                          item.question
                        }

                      </h2>


                      {
                        item.description
                        && (

                          <p
                            style={
                              styles.descriptionTextSmall
                            }
                          >

                            {
                              item.description
                            }

                          </p>
                        )
                      }

                    </div>

                  </div>


                  {/* USER ANSWER — RIGHT */}

                  <motion.div

                    initial={{
                      opacity: 0,
                      x: 10,
                      scale: 0.95,
                    }}

                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                    }}

                    style={
                      styles.userMessageRow
                    }
                  >

                    <div
                      style={
                        styles.userBubble
                      }
                    >

                      {
                        item.answer
                      }

                    </div>

                  </motion.div>

                </div>
              )
            )
          }


          {/* =================================================
              2. ACTIVE TYPING QUESTION
          ================================================== */}

          {
            !showSubmit
            &&
            !isTransitioning
            &&
            currentQuestion
            && (

              <div
                style={
                  styles.aiMessageRow
                }
              >

                <div
                  style={
                    styles.botAvatar
                  }
                >
                  AI
                </div>


                <div
                  style={
                    styles.aiBubble
                  }
                >

                  <h2
                    style={
                      styles.questionText
                    }
                  >

                    {typedText}

                  </h2>


                  {
                    currentQuestion.description
                    && (

                      <p
                        style={
                          styles.descriptionText
                        }
                      >

                        {
                          typedDescription
                        }

                      </p>
                    )
                  }

                </div>

              </div>
            )
          }


          {/* =================================================
              3. INTERACTION AREA
          ================================================== */}

          <div
            style={
              styles.interactionArea
            }
          >


            {/* ===============================================
                CHOICE OPTIONS
            ================================================ */}

            {
              currentQuestion?.type
              ===
              "choice"
              &&
              showOptions
              &&
              !showSubmit
              && (

                <div
                  style={
                    styles.optionsGrid
                  }
                >

                  {
                    currentQuestion.options.map(
                      (
                        option,
                        index
                      ) => (

                        <motion.button

                          key={
                            `${currentQuestion.key}-${String(
                              option.value
                            )}`
                          }

                          initial={{
                            opacity: 0,
                            y: 10,
                          }}

                          animate={{
                            opacity: 1,
                            y: 0,
                          }}

                          transition={{
                            delay:
                              index * 0.05,
                          }}

                          whileHover={{
                            scale: 1.05,
                            backgroundColor:
                              "#f5f3ff",
                            borderColor:
                              "#6366f1",
                          }}

                          whileTap={{
                            scale: 0.95,
                          }}

                          style={
                            styles.optionChip
                          }

                          onClick={
                            () => {

                              handleAnswer(
                                option.value,
                                option.label
                              );

                            }
                          }
                        >

                          {
                            option.label
                          }

                        </motion.button>
                      )
                    )
                  }

                </div>
              )
            }


            {/* ===============================================
                RATING 1–5
            ================================================ */}

            {
              currentQuestion?.type
              ===
              "rating"
              &&
              showOptions
              &&
              !showSubmit
              && (

                <div
                  style={
                    styles.ratingRow
                  }
                >

                  {
                    [
                      1,
                      2,
                      3,
                      4,
                      5,
                    ].map(
                      (
                        number,
                        index
                      ) => {

                        const scaleLabel =
                          currentQuestion
                            .scaleLabels[
                              index
                            ];


                        return (

                          <motion.button

                            key={
                              number
                            }

                            initial={{
                              opacity: 0,
                              y: 10,
                            }}

                            animate={{
                              opacity: 1,
                              y: 0,
                            }}

                            transition={{
                              delay:
                                index * 0.05,
                            }}

                            whileHover={{
                              scale: 1.05,
                              backgroundColor:
                                "#f5f3ff",
                              borderColor:
                                "#6366f1",
                            }}

                            whileTap={{
                              scale: 0.95,
                            }}

                            style={
                              styles.ratingChip
                            }

                            onClick={
                              () => {

                                handleAnswer(
                                  number,
                                  `${number} — ${scaleLabel}`
                                );

                              }
                            }
                          >

                            <span
                              style={
                                styles.ratingNum
                              }
                            >

                              {
                                number
                              }

                            </span>


                            <span
                              style={
                                styles.ratingLabel
                              }
                            >

                              {
                                scaleLabel
                              }

                            </span>

                          </motion.button>
                        );
                      }
                    )
                  }

                </div>
              )
            }



            {/* ===============================================
                FINAL ANALYSIS ACTION
            ================================================ */}

            {
              showSubmit
              && (

                <motion.div

                  initial={{
                    opacity: 0,
                    y: 20,
                  }}

                  animate={{
                    opacity: 1,
                    y: 0,
                  }}

                  style={
                    styles.finalActions
                  }
                >

                  <div
                    style={
                      styles.completionNotice
                    }
                  >

                    <div>

                      <strong
                        style={{
                          display:
                            "block",

                          color:
                            "#1e293b",
                        }}
                      >

                        {
                          langData.completionTitle
                        }

                      </strong>


                      <span
                        style={{
                          color:
                            "#64748b",

                          fontSize:
                            "14px",
                        }}
                      >

                        {
                          langData.completionSubtitle
                        }

                      </span>

                    </div>

                  </div>


                  <motion.button

                    whileHover={{
                      scale: 1.02,

                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}

                    whileTap={{
                      scale: 0.98,
                    }}

                    style={
                      styles.primaryButton
                    }

                    onClick={
                      handleSubmit
                    }
                  >

                    {
                      langData.finish
                    }

                  </motion.button>

                </motion.div>
              )
            }

          </div>


          {/* AUTO-SCROLL ANCHOR */}

          <div
            ref={
              scrollRef
            }

            style={{
              height: "40px",
            }}
          />

        </div>

      </main>

    </div>
  );
}


// ============================================================
// ORIGINAL VISUAL STYLE
//
// The overall layout, color palette, bubbles, cards,
// progress bar and conversational UI are preserved.
// ============================================================

const styles = {

  pageWrapper: {

    minHeight:
      "100vh",

    backgroundColor:
      "#f9fafb",

    color:
      "#1e293b",

    fontFamily:
      "'Inter', -apple-system, sans-serif",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",
  },


  headerNav: {

    width:
      "100%",

    maxWidth:
      "800px",

    padding:
      "20px 24px",

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

    position:
      "sticky",

    top:
      0,

    backgroundColor:
      "rgba(249, 250, 251, 0.9)",

    backdropFilter:
      "blur(8px)",

    zIndex:
      1000,
  },


  logo: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "8px",

    fontWeight:
      "700",

    fontSize:
      "16px",

    color:
      "#0f172a",
  },


  logoIcon: {

    color:
      "#4f46e5",

    fontSize:
      "20px",
  },


  miniProgress: {

    fontSize:
      "12px",

    fontWeight:
      "600",

    color:
      "#64748b",

    backgroundColor:
      "#fff",

    padding:
      "4px 12px",

    borderRadius:
      "20px",

    border:
      "1px solid #e2e8f0",
  },


  headerLogo: {

    width:
      "20px",

    height:
      "20px",

    objectFit:
      "contain",

    borderRadius:
      "4px",
  },


  centerLogo: {

    width:
      "180px",

    height:
      "180px",

    objectFit:
      "contain",

    margin:
      "0 auto 24px",

    marginTop:
      "-80px",

    display:
      "block",
  },


  mainContent: {

    width:
      "100%",

    maxWidth:
      "800px",

    padding:
      "40px 24px",

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "center",

    flex:
      1,
  },


  heroSection: {

    textAlign:
      "center",

    maxWidth:
      "600px",

    margin:
      "0 auto",
  },


  badge: {

    display:
      "inline-block",

    padding:
      "4px 12px",

    borderRadius:
      "20px",

    backgroundColor:
      "#eef2ff",

    color:
      "#4f46e5",

    fontSize:
      "11px",

    fontWeight:
      "700",

    marginBottom:
      "16px",

    letterSpacing:
      "0.05em",
  },


  mainTitle: {

    fontSize:
      "36px",

    lineHeight:
      "1.2",

    fontWeight:
      "800",

    color:
      "#0f172a",

    marginBottom:
      "16px",

    letterSpacing:
      "-0.02em",
  },


  mainSubtitle: {

    fontSize:
      "17px",

    color:
      "#475569",

    marginBottom:
      "40px",

    lineHeight:
      "1.5",
  },


  langGrid: {

    display:
      "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",

    gap:
      "16px",

    width:
      "100%",
  },


  langCard: {

    backgroundColor:
      "#fff",

    border:
      "1px solid #e2e8f0",

    padding:
      "24px",

    borderRadius:
      "16px",

    cursor:
      "pointer",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    transition:
      "all 0.2s ease",
  },


  langLabel: {

    fontSize:
      "18px",

    fontWeight:
      "600",

    color:
      "#1e293b",

    marginBottom:
      "4px",
  },


  langSub: {

    fontSize:
      "13px",

    color:
      "#94a3b8",
  },


  welcomeCard: {

    backgroundColor:
      "#fff",

    padding:
      "40px",

    borderRadius:
      "24px",

    textAlign:
      "center",

    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.05)",

    border:
      "1px solid #e2e8f0",
  },


  botAvatarLarge: {

    width:
      "70px",

    height:
      "70px",

    borderRadius:
      "20px",

    background:
      "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    fontSize:
      "30px",

    margin:
      "0 auto 24px",
  },


  welcomeTitle: {

    fontSize:
      "24px",

    fontWeight:
      "700",

    color:
      "#0f172a",

    marginBottom:
      "16px",
  },


  welcomeText: {

    fontSize:
      "16px",

    color:
      "#475569",

    lineHeight:
      "1.6",

    marginBottom:
      "32px",
  },


  returningUserSection: {

    marginTop:
      "22px",

    textAlign:
      "center",
  },


  returningText: {

    fontSize:
      "14px",

    color:
      "#94a3b8",

    marginBottom:
      "8px",
  },


  conversationLink: {

    background:
      "none",

    border:
      "none",

    fontSize:
      "18px",

    fontWeight:
      "600",

    cursor:
      "pointer",

    padding:
      0,

    transition:
      "all 0.2s ease",
  },


  chatContainer: {

    width:
      "100%",

    maxWidth:
      "750px",

    padding:
      "20px 24px",

    paddingTop:
      "30px",

    flex:
      1,
  },


  topProgressContainer: {

    width:
      "100%",

    height:
      "3px",

    backgroundColor:
      "#e2e8f0",

    position:
      "fixed",

    top:
      "72px",

    left:
      0,

    zIndex:
      9999,
  },


  topProgressBar: {

    height:
      "100%",

    backgroundColor:
      "#4f46e5",

    transition:
      "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  },


  messageList: {

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "24px",
  },


  historyGroup: {

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "16px",
  },


  aiMessageRow: {

    display:
      "flex",

    gap:
      "12px",

    alignItems:
      "flex-start",

    maxWidth:
      "85%",
  },


  userMessageRow: {

    display:
      "flex",

    justifyContent:
      "flex-end",

    width:
      "100%",
  },


  botAvatar: {

    width:
      "32px",

    height:
      "32px",

    borderRadius:
      "8px",

    backgroundColor:
      "#0f172a",

    color:
      "#fff",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    fontSize:
      "10px",

    fontWeight:
      "700",

    flexShrink:
      0,
  },


  aiBubble: {

    backgroundColor:
      "#fff",

    padding:
      "16px 20px",

    borderRadius:
      "2px 18px 18px 18px",

    boxShadow:
      "0 2px 5px rgba(0,0,0,0.03)",

    border:
      "1px solid #e2e8f0",
  },


  userBubble: {

    backgroundColor:
      "#6b7280",

    color:
      "#fff",

    padding:
      "12px 20px",

    borderRadius:
      "18px 18px 2px 18px",

    fontSize:
      "15px",

    fontWeight:
      "500",

    maxWidth:
      "70%",

    boxShadow:
      "0 4px 12px rgba(107, 114, 128, 0.25)",
  },


  questionText: {

    fontSize:
      "20px",

    fontWeight:
      "700",

    color:
      "#0f172a",

    lineHeight:
      "1.4",

    margin:
      0,
  },


  questionTextSmall: {

    fontSize:
      "16px",

    fontWeight:
      "600",

    color:
      "#334155",

    lineHeight:
      "1.4",

    margin:
      0,
  },


  descriptionText: {

    fontSize:
      "15px",

    color:
      "#475569",

    lineHeight:
      "1.5",

    marginTop:
      "8px",

    marginBottom:
      0,
  },


  descriptionTextSmall: {

    fontSize:
      "14px",

    color:
      "#64748b",

    lineHeight:
      "1.5",

    marginTop:
      "4px",

    marginBottom:
      0,
  },


  interactionArea: {

    paddingLeft:
      "44px",

    marginTop:
      "8px",
  },


  optionsGrid: {

    display:
      "flex",

    flexWrap:
      "wrap",

    gap:
      "8px",
  },


  optionChip: {

    backgroundColor:
      "#fff",

    border:
      "1px solid #d1d5db",

    padding:
      "8px 16px",

    borderRadius:
      "20px",

    fontSize:
      "14px",

    fontWeight:
      "500",

    cursor:
      "pointer",

    color:
      "#4b5563",

    transition:
      "all 0.2s ease",
  },


  ratingRow: {

    display:
      "flex",

    gap:
      "8px",

    flexWrap:
      "wrap",
  },


  ratingChip: {

    backgroundColor:
      "#fff",

    border:
      "1px solid #d1d5db",

    padding:
      "10px",

    borderRadius:
      "12px",

    cursor:
      "pointer",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    minWidth:
      "70px",

    transition:
      "all 0.2s ease",
  },


  ratingNum: {

    fontSize:
      "16px",

    fontWeight:
      "700",

    color:
      "#4f46e5",
  },


  ratingLabel: {

    fontSize:
      "9px",

    fontWeight:
      "700",

    color:
      "#94a3b8",

    textTransform:
      "uppercase",

    marginTop:
      "2px",
  },


  finalActions: {

    width:
      "100%",

    marginTop:
      "10px",
  },


  completionNotice: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "12px",

    padding:
      "16px",

    backgroundColor:
      "#f8fafc",

    borderRadius:
      "12px",

    border:
      "1px solid #e2e8f0",

    marginBottom:
      "16px",
  },


  primaryButton: {

    width:
      "100%",

    backgroundColor:
      "#0f172a",

    color:
      "#fff",

    border:
      "none",

    padding:
      "16px",

    borderRadius:
      "12px",

    fontSize:
      "16px",

    fontWeight:
      "600",

    cursor:
      "pointer",

    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },


  secondaryButton: {

    width:
      "100%",

    backgroundColor:
      "#ffffff",

    color:
      "#334155",

    border:
      "1px solid #e2e8f0",

    padding:
      "14px",

    borderRadius:
      "12px",

    fontSize:
      "15px",

    fontWeight:
      "600",

    cursor:
      "pointer",

    marginTop:
      "12px",

    transition:
      "all 0.2s ease",

    boxShadow:
      "0 1px 3px rgba(0,0,0,0.04)",
  },


  loadingContainer: {

    flex:
      1,

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    textAlign:
      "center",
  },


  loadingPulse: {

    width:
      "50px",

    height:
      "50px",

    backgroundColor:
      "#4f46e5",

    borderRadius:
      "15px",

    marginBottom:
      "20px",
  },


  loadingText: {

    fontSize:
      "20px",

    fontWeight:
      "700",

    color:
      "#0f172a",

    marginBottom:
      "8px",
  },


  loadingSub: {

    color:
      "#64748b",

    fontSize:
      "14px",

    maxWidth:
      "300px",

    lineHeight:
      "1.5",
  },
};