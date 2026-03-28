import { NextRequest, NextResponse } from "next/server";
import { Mistral } from '@mistralai/mistralai';

// Simple in-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_DAY = 5;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
}

function getRateLimitInfo(ip: string): { remaining: number; max: number; count: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    return { remaining: MAX_REQUESTS_PER_DAY, max: MAX_REQUESTS_PER_DAY, count: 0 };
  }
  return {
    remaining: Math.max(0, MAX_REQUESTS_PER_DAY - record.count),
    max: MAX_REQUESTS_PER_DAY,
    count: record.count,
  };
}

// GET: Fetch current rate limit status (called on page load)
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const info = getRateLimitInfo(ip);
  return NextResponse.json({ rateLimitInfo: info });
}

// POST: Submit a question to the council
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const now = Date.now();

    // Check & update rate limit
    const record = rateLimitMap.get(ip);
    let currentCount: number;

    if (!record || now > record.resetTime) {
      // First request or window expired — start fresh
      currentCount = 1;
      rateLimitMap.set(ip, { count: 1, resetTime: now + DAY_IN_MS });
    } else if (record.count >= MAX_REQUESTS_PER_DAY) {
      return NextResponse.json(
        { error: "Daily limit of 5 questions reached. Please come back tomorrow." },
        { status: 429 }
      );
    } else {
      currentCount = record.count + 1;
      rateLimitMap.set(ip, { count: currentCount, resetTime: record.resetTime });
    }

    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const client = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY || "",
    });

    const personalities = [
      { id: process.env.AGENT_JOY, name: "Joy" },
      { id: process.env.AGENT_SADNESS, name: "Sadness" },
      { id: process.env.AGENT_ANGER, name: "Anger" },
      { id: process.env.AGENT_FEAR, name: "Fear" },
      { id: process.env.AGENT_SURPRISE, name: "Surprise" },
    ];

    const messages = [{ role: "user" as const, content: question.trim() }];

    // Helper to extract text from Mistral conversation response
    function extractText(res: unknown): string {
      const r = res as any;
      if (r?.outputs) {
        // Find the last message.output entry (the final assistant reply)
        const msgs = r.outputs.filter(
          (o: any) => o.type === "message.output" || o.role === "assistant"
        );
        const last = msgs[msgs.length - 1];
        const c = last?.content;
        if (typeof c === "string") return c;
        if (Array.isArray(c)) return c.map((p: any) => p.text || "").join("");
      }
      if (r?.choices?.[0]?.message?.content) {
        return r.choices[0].message.content;
      }
      return "";
    }

    // Parallel calls to 5 personality agents
    const rawResponses = await Promise.all(
      personalities.map(async (p) => {
        if (!p.id) {
          return `[Agent ID for ${p.name} is not configured in .env]`;
        }
        try {
          const res = await client.beta.conversations.start({
            agentId: p.id,
            inputs: messages as any,
          });
          const text = extractText(res);
          return text || "No response generated.";
        } catch (err: any) {
          console.error(`Error with agent ${p.name}:`, err.message);
          return "An error occurred fetching this perspective.";
        }
      })
    );

    const [joyRes, sadRes, angerRes, fearRes, surpriseRes] = rawResponses;

    // Call the Concluder to synthesize everything
    let concluderRes = "[Concluder Agent ID not configured in .env]";
    if (process.env.AGENT_ADVISOR) {
      const concluderPrompt = `The user asked: "${question.trim()}"

Here are the 5 emotional perspectives:

JOY: ${joyRes}

SADNESS: ${sadRes}

ANGER: ${angerRes}

FEAR: ${fearRes}

SURPRISE: ${surpriseRes}

Now synthesize all of these into a clear, actionable conclusion. Tell the user exactly what they should do. Be direct, practical, and wise.`;

      try {
        const advObj = await client.beta.conversations.start({
          agentId: process.env.AGENT_ADVISOR,
          inputs: [{ role: "user" as const, content: concluderPrompt }] as any,
        });
        const text = extractText(advObj);
        if (text) concluderRes = text;
      } catch (err: any) {
        console.error(`Error with Concluder:`, err.message);
        concluderRes = "An error occurred connecting to the Concluder.";
      }
    }

    return NextResponse.json({
      responses: rawResponses,
      advisorResponse: concluderRes,
      rateLimitInfo: {
        remaining: MAX_REQUESTS_PER_DAY - currentCount,
        max: MAX_REQUESTS_PER_DAY,
      },
    });
  } catch (error: any) {
    console.error("API Error in /api/ask:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
