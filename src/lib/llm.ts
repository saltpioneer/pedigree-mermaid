const OPENAI_PROMPT = `Convert the following genealogical text into Mermaid flowchart syntax. Use a left-to-right layout.

Rules:

* Represent individuals as nodes.
* Represent parent → child with arrows.
* Represent marriages with a diamond node (e.g. A --> M1 & B --> M1).
* Avoid guessing missing data.
* Ensure Mermaid is syntactically valid.

Output ONLY the Mermaid code block.`;

export async function convertTextToMermaid(text: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || `API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  const mermaidCode = data.choices[0]?.message?.content?.trim() || '';

  if (!mermaidCode) {
    throw new Error('No Mermaid code returned from API');
  }

  // Extract Mermaid code from markdown code blocks if present
  const codeBlockMatch = mermaidCode.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : mermaidCode.trim();
}

