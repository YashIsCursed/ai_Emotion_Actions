import { NextRequest, NextResponse } from "next/server";
import { Mistral } from '@mistralai/mistralai';

// Simple in-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const MAX_REQUESTS_PER_DAY = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'anonymous';
    const now = Date.now();
    
    // Check rate limit
    const record = rateLimitMap.get(ip);
    let currentCount = 1;
    if (record) {
      if (now > record.resetTime) {
        // Reset after 24 hours
        rateLimitMap.set(ip, { count: 1, resetTime: now + DAY_IN_MS });
      } else if (record.count >= MAX_REQUESTS_PER_DAY) {
        return NextResponse.json({ error: "Daily limit of 5 questions reached. Please come back tomorrow!" }, { status: 429 });
      } else {
        currentCount = record.count + 1;
        rateLimitMap.set(ip, { count: currentCount, resetTime: record.resetTime });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + DAY_IN_MS });
    }

    const body = await req.json();
    const { question } = body;

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Initialize Mistral with API Key
    const client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY || "",
    });

    // The environment variables matching user's mistral setup
    const personalities = [
      { id: process.env.AGENT_JOY, name: "Joy" },
      { id: process.env.AGENT_SADNESS, name: "Sadness" },
      { id: process.env.AGENT_ANGER, name: "Anger" },
      { id: process.env.AGENT_FEAR, name: "Fear" },
      { id: process.env.AGENT_SURPRISE, name: "Surprise" },
    ];

    const messages = [{ role: "user", content: question }];

    // Parallel calls to 5 personality agents
    const rawResponses = await Promise.all(
      personalities.map(async (p) => {
        if (!p.id) {
           return `[Error] Agent ID for ${p.name} not configured in .env`;
        }
        try {
          const res = await client.beta.conversations.start({
            agentId: p.id,
            inputs: messages as any,
          });
          
          let text = "";
          // Extract content securely from alternative potential mistral response formats 
          if (res && (res as any).outputs) {
             const messageOutput = (res as any).outputs.find((o: any) => o.type === "message.output" || o.role === "assistant");
             const c = messageOutput?.content;
             if (typeof c === 'string') text = c;
             else if (Array.isArray(c)) text = c.map((part: any) => part.text || "").join("");
          } else if (res && (res as any).choices) {
             text = (res as any).choices[0].message.content;
          }
          
          return text || "No response generated.";
        } catch (err: any) {
          console.error(`Error with agent ${p.name}:`, err.message);
          return "An error occurred fetching personality response.";
        }
      })
    );

    const [joyRes, sadRes, angerRes, fearRes, surpriseRes] = rawResponses;

    // Call the Advisor Agent to Synthesize the responses
    let advisorRes = "[Error] Advisor Agent ID not configured in .env";
    if (process.env.AGENT_ADVISOR) {
      const advisorPrompt = `User's Question: "${question}"\n\nHere is how the 5 personalities responded:\nJoy: ${joyRes}\nSadness: ${sadRes}\nAnger: ${angerRes}\nFear: ${fearRes}\nSurprise: ${surpriseRes}\n\nSynthesize these responses into a wise, balanced final piece of advice that honors all their perspectives. Ensure you output only the final response text.`;

      try {
        const advObj = await client.beta.conversations.start({
          agentId: process.env.AGENT_ADVISOR,
          inputs: [{ role: "user", content: advisorPrompt }] as any,
        });
        
        if (advObj && (advObj as any).outputs) {
             const messageOutput = (advObj as any).outputs.find((o: any) => o.type === "message.output" || o.role === "assistant");
             const c = messageOutput?.content;
             if (typeof c === 'string') advisorRes = c;
             else if (Array.isArray(c)) advisorRes = c.map((part: any) => part.text || "").join("");
        } else if (advObj && (advObj as any).choices) {
             advisorRes = (advObj as any).choices[0].message.content;
        }
      } catch (err: any) {
         console.error(`Error with Advisor:`, err.message);
         advisorRes = "An error occurred connecting to the Advisor.";
      }
    }

    return NextResponse.json({
      responses: rawResponses,
      advisorResponse: advisorRes,
      rateLimitInfo: {
        remaining: MAX_REQUESTS_PER_DAY - currentCount,
        max: MAX_REQUESTS_PER_DAY,
      }
    });

  } catch (error: any) {
    console.error("API Error in /api/ask:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
