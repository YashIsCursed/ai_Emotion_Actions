"use client";

import { useState, useEffect } from "react";

const personalities = [
  { name: "JOY", emoji: "😄", accent: "#e85d26", width: "22%" },
  { name: "SADNESS", emoji: "😢", accent: "#2563eb", width: "18%" },
  { name: "ANGER", emoji: "😡", accent: "#dc2626", width: "26%" },
  { name: "FEAR", emoji: "😨", accent: "#7c3aed", width: "16%" },
  { name: "SURPRISE", emoji: "😲", accent: "#059669", width: "18%" },
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState("");
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [responses, setResponses] = useState<string[]>(Array(5).fill("Connecting to consciousness..."));
  const [advisorResponse, setAdvisorResponse] = useState("Synthesizing perspectives...");
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number, max: number } | null>(null);

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;
    
    // Start animation sequences & UI flip
    setCurrentQ(question);
    setSubmitted(true);
    setLoading(true);
    setVisibleCards([]);
    setShowAdvisor(false);
    setErrorMsg(null);
    setResponses(Array(5).fill("... processing ..."));
    setAdvisorResponse("...");

    try {
      const resp = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }
      
      setResponses(data.responses);
      setAdvisorResponse(data.advisorResponse);
      if (data.rateLimitInfo) {
        setRateLimitInfo(data.rateLimitInfo);
      }
      
      // Animate card entries
      personalities.forEach((_, i) => {
        setTimeout(() => setVisibleCards(prev => [...prev, i]), 300 + i * 250);
      });
      setTimeout(() => {
        setShowAdvisor(true);
        setLoading(false);
      }, 300 + personalities.length * 250 + 600);

    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f2ece0",
      color: "#1a1a1a",
      fontFamily: "Georgia, 'Times New Roman', serif",
      position: "relative",
    }}>
      {/* Dynamic Animated Grain / Noise Background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.8,
        animation: "grainShift 8s steps(10) infinite",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{
              fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
              fontFamily: "'Courier New', monospace", color: "#888",
            }}>
              Limited Run • Digital Edition
            </div>
          </div>
          <div style={{
              fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
              fontFamily: "'Courier New', monospace", color: "#666",
            }}>
            {rateLimitInfo ? `[ ${rateLimitInfo.remaining} OF ${rateLimitInfo.max} INQUIRIES REMAINING TODAY ]` : '[ 5 INQUIRIES PER DAY ]'}
          </div>
        </div>

        {/* Masthead */}
        <div style={{
          textAlign: "center", margin: "32px 0 24px",
          borderTop: "3px solid #1a1a1a",
          borderBottom: "1px solid #1a1a1a",
          padding: "30px 0",
          animation: "brutalFadeIn 1s ease",
        }}>
          <h1 style={{
            fontSize: "clamp(56px, 9vw, 110px)",
            fontWeight: 400,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            fontStyle: "italic",
            textShadow: "2px 2px 0px rgba(0,0,0,0.05)",
          }}>
            Mind Council
          </h1>
          <div style={{
            fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase",
            fontFamily: "'Courier New', monospace", color: "#555",
            marginTop: 16,
            display: "flex", justifyContent: "center", gap: 24, alignItems: "center"
          }}>
             <span>⸺</span> Five Perspectives <span>•</span> One Truth <span>⸺</span>
          </div>
        </div>

        {/* Search Input Area */}
        <div style={{
          maxWidth: 900, margin: "40px auto 10px",
          borderBottom: "3px solid #1a1a1a",
          paddingBottom: 4,
          animation: "brutalSlideUp 0.8s ease 0.2s both",
        }}>
          <label style={{
            display: "block", fontSize: 13, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#777",
            fontFamily: "'Courier New', monospace", marginBottom: 16,
            fontWeight: 700
          }}>
            THE INQUIRY —
          </label>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={loading}
              placeholder="What would you like to ask the council?"
              style={{
                flex: 1, fontSize: "clamp(24px, 4vw, 42px)",
                fontStyle: "italic", fontWeight: 400,
                background: "transparent", border: "none", outline: "none",
                color: "#1a1a1a", fontFamily: "Georgia, serif",
                paddingBottom: 4, width: "100%",
                opacity: loading ? 0.6 : 1, transition: "opacity 0.3s"
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="submit-btn"
              style={{
                padding: "14px 40px",
                background: "#1a1a1a", color: "#f2ece0",
                border: "none", cursor: loading ? "wait" : "pointer",
                fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase",
                fontFamily: "'Courier New', monospace", fontWeight: 700,
                opacity: loading ? 0.4 : 1,
              }}
            >
              {loading ? "SEEKING..." : "SUBMIT"}
            </button>
          </div>
        </div>
        
        {/* Error State */}
        {errorMsg && (
          <div style={{
             maxWidth: 900, margin: "20px auto", color: "#dc2626", 
             fontFamily: "'Courier New', monospace", fontSize: 12, textTransform: "uppercase",
             border: "1px solid #dc2626", padding: 12, background: "rgba(220, 38, 38, 0.05)"
          }}>
             [ FATAL ERROR ] : {errorMsg}
          </div>
        )}

        {/* Newspaper Column Layout */}
        {(submitted || loading) && !errorMsg && (
          <div style={{ animation: "brutalFadeIn 0.8s ease" }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
              fontFamily: "'Courier New', monospace", color: "#888",
              textAlign: "center", margin: "48px 0 24px",
            }}>
              ⸺ THE RESPONSES ⸺
            </div>

            <div className="columns-wrapper" style={{
              display: "flex", gap: 0,
              borderTop: "3px solid #1a1a1a",
              borderBottom: "3px solid #1a1a1a",
              flexWrap: "wrap",
            }}>
              {personalities.map((p, i) => (
                <div
                  key={p.name}
                  className="col-panel"
                  style={{
                    width: p.width,
                    borderRight: i < 4 ? "1px solid #ccc" : "none",
                    padding: "24px 20px",
                    opacity: visibleCards.includes(i) || loading ? 1 : 0,
                    transform: visibleCards.includes(i) || loading ? "translateY(0)" : "translateY(15px)",
                    transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    borderBottom: "none", /* handled by wrapper on desktop, flex fallback on mobile might need borders */
                  }}
                >
                  <div style={{
                    width: "100%", height: 4, background: p.accent,
                    marginBottom: 20,
                  }} />
                  
                  <div style={{ fontSize: 36, marginBottom: 12, filter: "grayscale(0.1)" }}>
                    {p.emoji}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 900, letterSpacing: "0.25em",
                    fontFamily: "'Courier New', monospace",
                    marginBottom: 16, color: p.accent,
                  }}>
                    {p.name}
                  </div>
                  
                  {visibleCards.includes(i) ? (
                    <p style={{
                      fontSize: 14, lineHeight: 1.8,
                      color: "#222", fontFamily: "Georgia, serif",
                    }}>
                      &ldquo;{responses[i]}&rdquo;
                    </p>
                  ) : (
                    <div style={{ 
                       height: 80, opacity: 0.3, 
                       animation: "skeletonPulse 1.5s infinite",
                       fontFamily: "'Courier New', monospace", fontSize: 10, color: p.accent
                    }}>
                      [ AWAITING SIGNAL... ]
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advisor Synthesis Module */}
        {(showAdvisor || (loading && visibleCards.length === 5)) && (
          <div style={{
            marginTop: 48, borderTop: "6px solid #1a1a1a",
            padding: "40px 0",
            animation: "brutalSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <div className="advisor-wrapper" style={{
              display: "flex", gap: 32, alignItems: "flex-start",
            }}>
              <div style={{ minWidth: 220, paddingTop: 6 }}>
                <div style={{
                  fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase",
                  fontFamily: "'Courier New', monospace", color: "#888",
                  marginBottom: 12, fontWeight: 700
                }}>
                  THE FINAL WORD
                </div>
                <div style={{
                  fontSize: "clamp(36px, 5vw, 48px)",
                  fontStyle: "italic", fontWeight: 400,
                  lineHeight: 1.1, letterSpacing: "-0.04em",
                }}>
                  The<br/>Advisor
                </div>
                <div style={{ fontSize: 32, marginTop: 16 }}>🧩</div>
              </div>
              <div style={{
                borderLeft: "3px solid #1a1a1a",
                paddingLeft: 32, flex: 1,
              }}>
                <p style={{
                  fontSize: "clamp(18px, 2vw, 22px)", lineHeight: 1.8,
                  color: "#1a1a1a", fontFamily: "Georgia, serif",
                  minHeight: 120
                }}>
                  {!showAdvisor ? (
                     <span style={{ opacity: 0.5, fontStyle: "italic" }}>Distilling truth from chaos...</span>
                  ) : (
                    <>&ldquo;{advisorResponse}&rdquo;</>
                  )}
                </p>
              </div>
            </div>
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
        input::placeholder { color: #aaa; font-style: italic; }
        .submit-btn {
           transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .submit-btn:not(:disabled):hover { 
           background: #da291c !important; /* brutalist red pop on hover */
           transform: translateY(-2px);
           box-shadow: 4px 4px 0px rgba(0,0,0,1);
        }
        .submit-btn:not(:disabled):active {
           transform: translateY(0px) translateX(2px);
           box-shadow: 2px 2px 0px rgba(0,0,0,1);
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
           .columns-wrapper { flex-direction: column; }
           .col-panel { width: 100% !important; border-right: none !important; border-bottom: 1px solid #ccc; }
           .col-panel:last-child { border-bottom: none; }
           .advisor-wrapper { flex-direction: column; }
           .advisor-wrapper > div:last-child { border-left: none; padding-left: 0; padding-top: 24px; border-top: 2px solid #ccc; }
        }
      `}</style>
    </div>
  );
}
