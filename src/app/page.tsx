"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const personalities = [
  { name: "JOY", emoji: "😄", accent: "#e85d26" },
  { name: "SADNESS", emoji: "😢", accent: "#2563eb" },
  { name: "ANGER", emoji: "😡", accent: "#dc2626" },
  { name: "FEAR", emoji: "😨", accent: "#7c3aed" },
  { name: "SURPRISE", emoji: "😲", accent: "#059669" },
];

const exampleQuestions = [
  "Should I quit my job and start a business?",
  "Is it worth moving to a new city for a fresh start?",
  "Should I forgive someone who hurt me deeply?",
  "Is it too late to change my career at 30?",
  "Should I tell my best friend how I really feel?",
  "Is social media destroying my mental health?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [showConcluder, setShowConcluder] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [responses, setResponses] = useState<string[]>(Array(5).fill(""));
  const [concluderResponse, setConcluderResponse] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    max: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, []);

  // Fetch rate limit on mount
  useEffect(() => {
    fetch("/api/ask")
      .then((r) => r.json())
      .then((data) => {
        if (data.rateLimitInfo) setRateLimitInfo(data.rateLimitInfo);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(
    async (q?: string) => {
      const finalQ = (q || question).trim();
      if (!finalQ || loading) return;

      setQuestion(finalQ);
      setSubmitted(true);
      setLoading(true);
      setVisibleCards([]);
      setShowConcluder(false);
      setErrorMsg(null);
      setResponses(Array(5).fill(""));
      setConcluderResponse("");

      try {
        const resp = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: finalQ }),
        });
        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        setResponses(data.responses);
        setConcluderResponse(data.advisorResponse);
        if (data.rateLimitInfo) {
          setRateLimitInfo(data.rateLimitInfo);
        }

        // Stagger card reveals
        personalities.forEach((_, i) => {
          setTimeout(
            () => setVisibleCards((prev) => [...prev, i]),
            400 + i * 280,
          );
        });
        setTimeout(
          () => {
            setShowConcluder(true);
            setLoading(false);
          },
          400 + personalities.length * 280 + 700,
        );
      } catch (err: any) {
        setLoading(false);
        setErrorMsg(err.message);
      }
    },
    [question, loading],
  );

  const isExhausted = rateLimitInfo !== null && rateLimitInfo.remaining <= 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f2ece0",
        color: "#1a1a1a",
        fontFamily: "Georgia, 'Times New Roman', serif",
        position: "relative",
      }}
    >
      {/* Grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.8,
          animation: "grainShift 8s steps(10) infinite",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "'Courier New', monospace",
              color: "#888",
            }}
          >
            Limited Run • Digital Edition
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "'Courier New', monospace",
              color: isExhausted ? "#dc2626" : "#666",
              fontWeight: isExhausted ? 700 : 400,
            }}
          >
            {rateLimitInfo
              ? `[ ${rateLimitInfo.remaining} OF ${rateLimitInfo.max} INQUIRIES REMAINING TODAY ]`
              : "[ LOADING... ]"}
          </div>
        </div>

        {/* Masthead */}
        <div
          style={{
            textAlign: "center",
            margin: "32px 0 24px",
            borderTop: "3px solid #1a1a1a",
            borderBottom: "1px solid #1a1a1a",
            padding: "30px 0",
            animation: "brutalFadeIn 1s ease",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(56px, 9vw, 110px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              fontStyle: "italic",
              textShadow: "2px 2px 0px rgba(0,0,0,0.05)",
            }}
          >
            Mind Council
          </h1>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              fontFamily: "'Courier New', monospace",
              color: "#555",
              marginTop: 16,
              display: "flex",
              justifyContent: "center",
              gap: 24,
              alignItems: "center",
            }}
          >
            <span>⸺</span> Five Perspectives <span>•</span> One Conclusion{" "}
            <span>⸺</span>
          </div>
        </div>

        {/* Input area */}
        <div
          style={{
            maxWidth: 900,
            margin: "40px auto 10px",
            borderBottom: "3px solid #1a1a1a",
            paddingBottom: 4,
            animation: "brutalSlideUp 0.8s ease 0.2s both",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 13,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#777",
              fontFamily: "'Courier New', monospace",
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            THE INQUIRY —
          </label>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                autoResize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={loading || isExhausted}
              placeholder={
                isExhausted
                  ? "You've used all inquiries for today"
                  : "What would you like to ask the council?"
              }
              style={{
                flex: 1,
                fontSize: "clamp(20px, 3vw, 34px)",
                fontStyle: "italic",
                fontWeight: 400,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#1a1a1a",
                fontFamily: "Georgia, serif",
                paddingBottom: 4,
                width: "100%",
                opacity: loading || isExhausted ? 0.5 : 1,
                transition: "opacity 0.3s",
                resize: "none",
                overflow: "hidden",
                lineHeight: 1.4,
                minHeight: 48,
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || isExhausted}
              className="submit-btn"
              style={{
                padding: "14px 40px",
                background: "#1a1a1a",
                color: "#f2ece0",
                border: "2px solid #1a1a1a",
                cursor: loading || isExhausted ? "not-allowed" : "pointer",
                fontSize: 13,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                opacity: loading || isExhausted ? 0.35 : 1,
                flexShrink: 0,
                marginBottom: 4,
              }}
            >
              {loading ? "SEEKING..." : isExhausted ? "LIMIT HIT" : "SUBMIT"}
            </button>
          </div>
        </div>

        {/* Example questions — only shown before first submission */}
        {!submitted && !isExhausted && (
          <div
            style={{
              maxWidth: 900,
              margin: "32px auto 0",
              animation: "brutalFadeIn 1s ease 0.5s both",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontFamily: "'Courier New', monospace",
                color: "#999",
                marginBottom: 16,
              }}
            >
              TRY ASKING —
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {exampleQuestions.map((eq) => (
                <button
                  key={eq}
                  onClick={() => {
                    setQuestion(eq);
                    handleSubmit(eq);
                  }}
                  disabled={loading}
                  className="example-btn"
                  style={{
                    padding: "10px 18px",
                    background: "transparent",
                    border: "1px solid #bbb",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "Georgia, serif",
                    fontStyle: "italic",
                    color: "#444",
                    transition: "all 0.25s ease",
                  }}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div
            style={{
              maxWidth: 900,
              margin: "20px auto",
              color: "#dc2626",
              fontFamily: "'Courier New', monospace",
              fontSize: 12,
              textTransform: "uppercase",
              border: "1px solid #dc2626",
              padding: 12,
              background: "rgba(220, 38, 38, 0.05)",
            }}
          >
            [ ERROR ] — {errorMsg}
          </div>
        )}

        {/* Personality columns */}
        {submitted && !errorMsg && (
          <div style={{ animation: "brutalFadeIn 0.8s ease" }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                fontFamily: "'Courier New', monospace",
                color: "#888",
                textAlign: "center",
                margin: "48px 0 24px",
              }}
            >
              ⸺ THE RESPONSES ⸺
            </div>

            <div
              className="columns-wrapper"
              style={{
                display: "flex",
                gap: 0,
                borderTop: "3px solid #1a1a1a",
                borderBottom: "3px solid #1a1a1a",
              }}
            >
              {personalities.map((p, i) => (
                <div
                  key={p.name}
                  className="col-panel"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    borderRight: i < 4 ? "1px solid #ccc" : "none",
                    padding: "24px 20px",
                    opacity: visibleCards.includes(i) ? 1 : 0.4,
                    transform: visibleCards.includes(i)
                      ? "translateY(0)"
                      : "translateY(12px)",
                    transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      background: p.accent,
                      marginBottom: 20,
                    }}
                  />
                  <div style={{ fontSize: 24, marginBottom: 12 }}>
                    {p.emoji}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      letterSpacing: "0.25em",
                      fontFamily: "'Courier New', monospace",
                      marginBottom: 16,
                      color: p.accent,
                    }}
                  >
                    {p.name}
                  </div>

                  {visibleCards.includes(i) ? (
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.8,
                        color: "#222",
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      &ldquo;{responses[i]}&rdquo;
                    </p>
                  ) : (
                    <div
                      style={{
                        height: 80,
                        opacity: 0.4,
                        animation: "skeletonPulse 1.5s infinite",
                        fontFamily: "'Courier New', monospace",
                        fontSize: 10,
                        color: p.accent,
                      }}
                    >
                      [ AWAITING SIGNAL... ]
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concluder section */}
        {showConcluder && (
          <div
            style={{
              marginTop: 48,
              borderTop: "6px solid #1a1a1a",
              padding: "40px 0",
              animation: "brutalSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              className="concluder-wrapper"
              style={{
                display: "flex",
                gap: 32,
                alignItems: "flex-start",
              }}
            >
              <div style={{ minWidth: 220, paddingTop: 6, flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    fontFamily: "'Courier New', monospace",
                    color: "#888",
                    marginBottom: 12,
                    fontWeight: 700,
                  }}
                >
                  WHAT YOU SHOULD DO
                </div>
                <div
                  style={{
                    fontSize: "clamp(32px, 5vw, 48px)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    lineHeight: 1.1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  The
                  <br />
                  Concluder
                </div>
                <div style={{ fontSize: 32, marginTop: 16 }}>⚖️</div>
              </div>
              <div
                style={{
                  borderLeft: "3px solid #1a1a1a",
                  paddingLeft: 32,
                  flex: 1,
                }}
              >
                <p
                  style={{
                    fontSize: "clamp(17px, 2vw, 21px)",
                    lineHeight: 1.85,
                    color: "#1a1a1a",
                    fontFamily: "Georgia, serif",
                    minHeight: 100,
                  }}
                >
                  &ldquo;{concluderResponse}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ask another — shown after results are done */}
        {submitted && !loading && !errorMsg && (
          <div
            style={{
              textAlign: "center",
              marginTop: 40,
              animation: "brutalFadeIn 0.6s ease",
            }}
          >
            <button
              onClick={() => {
                setSubmitted(false);
                setQuestion("");
                setVisibleCards([]);
                setShowConcluder(false);
              }}
              disabled={isExhausted}
              className="submit-btn"
              style={{
                padding: "14px 48px",
                background: "transparent",
                color: "#1a1a1a",
                border: "2px solid #1a1a1a",
                cursor: isExhausted ? "not-allowed" : "pointer",
                fontSize: 12,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                opacity: isExhausted ? 0.35 : 1,
              }}
            >
              {isExhausted ? "NO INQUIRIES LEFT" : "ASK ANOTHER QUESTION"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes grainShift {
          0%, 100% { background-position: 0 0; }
          20% { background-position: -5% 10%; }
          40% { background-position: -15% 5%; }
          60% { background-position: 10% -10%; }
          80% { background-position: 0% 15%; }
        }
        @keyframes brutalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes brutalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        textarea::placeholder { color: #aaa; font-style: italic; }
        .submit-btn {
          transition: all 0.2s ease;
          position: relative;
        }
        .submit-btn:not(:disabled):hover {
          transform: translate(-3px, -3px);
          box-shadow: 3px 3px 0px #1a1a1a;
        }
        .submit-btn:not(:disabled):active {
          transform: translate(0px, 0px);
          box-shadow: none;
        }
        .example-btn {
          transition: all 0.2s ease;
          position: relative;
        }
        .example-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: 2px 2px 0px #1a1a1a;
          border-color: #1a1a1a !important;
          color: #1a1a1a !important;
        }
        .example-btn:active {
          transform: translate(0px, 0px);
          box-shadow: none;
        }
        @media (max-width: 900px) {
          .columns-wrapper { flex-direction: column !important; }
          .col-panel { flex: unset !important; width: 100% !important; border-right: none !important; border-bottom: 1px solid #ccc; }
          .col-panel:last-child { border-bottom: none; }
          .concluder-wrapper { flex-direction: column; }
          .concluder-wrapper > div:last-child { border-left: none; padding-left: 0; padding-top: 24px; border-top: 2px solid #ccc; }
        }
      `}</style>
    </div>
  );
}
