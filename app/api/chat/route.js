export const runtime = 'edge';

export async function POST(req) {
  const { topic, level } = await req.json();

  if (!topic || !level) {
    return new Response(JSON.stringify({ error: 'Missing topic or level' }), { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), { status: 500 });
  }

  const diffRule = {
    Advanced: 'Use precise technical vocabulary, deep mechanistic explanation, and structured reasoning. Assume expert-level reader.',
    Intermediate: 'Use clear terminology with logical structure and balanced depth.',
    Beginner: 'Use very simple language, everyday analogies, and minimal jargon.',
  }[level];

  const prompt = `You are RootLab, a structured AI learning engine by Nexocorp.
Topic: "${topic}"
Difficulty: ${level}

Output EXACTLY five sections using these emoji+label headers. Start directly with the first section — no preamble.

🌱 ROOT
2–3 paragraph foundational explanation. ${diffRule}

🧠 CORE
Break down the internal mechanisms. Use **bold** for all key terms.
Include 1–2 ASCII flow diagrams. Place diagrams on their own lines surrounded by blank lines. Use ONLY: → ↓ [ ] | and plain text labels. Max 8 lines per diagram. Do NOT embed arrows inside prose sentences.

🌿 BRANCHES
List exactly 5 related subtopics:
**Subtopic Name**
One to two sentence explanation.
(repeat 5 times)

🍎 FRUIT
2–3 paragraphs on real-world applications. **Bold** each industry name.

🌰 SEEDS
Five numbered follow-up questions:
1. Question?
2. Question?
3. Question?
4. Question?
5. Question?

Rules: Use **bold** for key terms. NO emojis except the five section headers. NO markdown headers (##). Clean prose. No filler.`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  const geminiRes = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2500 },
    }),
  });

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    return new Response(JSON.stringify({ error: err }), { status: 500 });
  }

  // Stream Gemini SSE → forward as plain text stream to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = geminiRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          } catch {}
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
