import express from 'express';
import OpenAI from 'openai';

export const convertApiRoute = express.Router();

const OPENAI_PROMPT = `Convert the following genealogical text into Mermaid flowchart syntax. Use a left-to-right layout.

Rules:

* Represent individuals as nodes.
* Represent parent → child with arrows.
* Represent marriages with a diamond node (e.g. A --> M1 & B --> M1).
* Avoid guessing missing data.
* Ensure Mermaid is syntactically valid.

Output ONLY the Mermaid code block.`;

async function convertTextToMermaid(text: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.');
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that converts genealogical text into Mermaid flowchart syntax.',
      },
      {
        role: 'user',
        content: `${OPENAI_PROMPT}\n\n${text}`,
      },
    ],
    temperature: 0.3,
  });

  const mermaidCode = response.choices[0]?.message?.content?.trim() || '';

  if (!mermaidCode) {
    throw new Error('No Mermaid code returned from API');
  }

  // Extract Mermaid code from markdown code blocks if present
  const codeBlockMatch = mermaidCode.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : mermaidCode.trim();
}

convertApiRoute.post('/convert', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text input is required and must be a non-empty string' });
    }

    const mermaidCode = await convertTextToMermaid(text.trim());

    res.json({ mermaid: mermaidCode });
  } catch (error) {
    console.error('Error in /api/convert:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

