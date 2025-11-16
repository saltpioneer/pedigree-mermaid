import express from 'express';
import OpenAI from 'openai';

export const convertApiRoute = express.Router();

const OPENAI_PROMPT = `Convert the following genealogical text into Mermaid flowchart syntax for a pedigree chart. Use a top-to-bottom (vertical) layout.

CRITICAL RULES FOR PEDIGREE CHARTS:

1. Create nodes for ALL individuals (both named and unnamed). For unnamed individuals, use scientific placeholders:
   - Unnamed husbands: "Husband 1", "Husband 2", etc. (node ID: husband1, husband2, etc.)
   - Unnamed wives: "Wife 1", "Wife 2", etc. (node ID: wife1, wife2, etc.)
   - Unnamed sons: "Son 1", "Son 2", etc. (node ID: son1, son2, etc.)
   - Unnamed daughters: "Daughter 1", "Daughter 2", etc. (node ID: daughter1, daughter2, etc.)
   - Unnamed parents: "Father 1", "Mother 1", etc. if gender is known, or "Parent 1", "Parent 2" if unknown
   - Number placeholders sequentially based on order mentioned in text
   - NEVER create nodes for literal words like "marriage" or "married" - these are not individuals

2. Node naming:
   - Named individuals: Use lowercase names with no spaces for node IDs (e.g., john, mary, sarah, jarred, mudra, arush)
   - Named format: nodeId[nodeLabel] where nodeLabel is the person's actual name (e.g., john[John], mary[Mary], sarah[Sarah])
   - Placeholder format: placeholderId[Placeholder Label] (e.g., husband1[Husband 1], son1[Son 1], daughter1[Daughter 1])
   - NEVER use "marriage", "married" as node IDs or labels unless they are actual names

3. Parent-Child Relationships (DIRECT CONNECTIONS):
   - When two parents have a child, BOTH parents connect DIRECTLY to the child: parent1[Parent1] --> child[Child] & parent2[Parent2] --> child[Child]
   - NO intermediate nodes - no marriage nodes, no M1/M2/M3, nothing between parents and children
   - If a parent is unnamed, create a placeholder node for them (e.g., husband1[Husband 1]) and connect it to the child
   - ALWAYS connect both parents to their shared children, even if one parent is unnamed (use placeholder)

4. Children nodes:
   - When specific children are named, create nodes for each named child (e.g., jarred[Jarred], mudra[Mudra])
   - When children are unnamed, use placeholders: "Son 1", "Son 2" for males, "Daughter 1", "Daughter 2" for females, or "Child 1", "Child 2" if gender unknown
   - When a number is specified (e.g., "41 kids", "5 children"), create ALL of them: child1[Child 1], child2[Child 2], child3[Child 3], ..., up to child41[Child 41]
   - Do NOT stop at 3 children if the text says more (e.g., if text says "41 kids", create child1 through child41)

5. Correctly identify relationships:
   - When text says "X and Y have a child Z": X --> Z & Y --> Z
   - When text says "X had children A and B with Y": X --> A & Y --> A & X --> B & Y --> B
   - When text mentions multiple relationships (e.g., "first husband" vs "second husband"):
     - Identify which children belong to which parent pair based on the text
     - Connect children to the CORRECT parents based on the text description
   - Pay close attention to phrases like "with her first husband" vs "with her second husband" to determine parent-child connections

6. Complete example for "Mudra had daughter Sarah and son Jack with first husband, then 1 son with Michael":
   - mudra[Mudra] --> sarah[Sarah] & husband1[Husband 1] --> sarah[Sarah]
   - mudra[Mudra] --> jack[Jack] & husband1[Husband 1] --> jack[Jack]
   - mudra[Mudra] --> son1[Son 1] & michael[Michael] --> son1[Son 1]
   - Note: "first husband" is unnamed, so create placeholder husband1[Husband 1] and connect to both Sarah and Jack. The unnamed son becomes son1[Son 1].

7. Another example for "John and Mary have a daughter Sarah, who married twice, had 2 kids (jarred, mudra) with first husband, then 41 kids with second husband (arush)":
   - john[John] --> sarah[Sarah] & mary[Mary] --> sarah[Sarah]
   - sarah[Sarah] --> jarred[Jarred] & husband1[Husband 1] --> jarred[Jarred]
   - sarah[Sarah] --> mudra[Mudra] & husband1[Husband 1] --> mudra[Mudra]
   - sarah[Sarah] --> child1[Child 1] & arush[Arush] --> child1[Child 1]
   - sarah[Sarah] --> child2[Child 2] & arush[Arush] --> child2[Child 2]
   - ... (continue for all 41 children: sarah --> childN & arush --> childN for each child)
   - Note: "first husband" is unnamed, so create placeholder husband1[Husband 1] and connect to jarred and mudra. For second marriage, both Sarah and arush connect to all 41 children.

8. Always preserve the exact relationships described in the text - do not infer relationships that aren't explicitly stated.

9. Ensure Mermaid is syntactically valid. Generate ALL nodes when a number is specified.

10. Use top-to-bottom layout: graph TD (not graph LR)

Output ONLY the Mermaid code block, no explanations.`;

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
    
    // Log the generated Mermaid code for debugging
    console.log('Generated Mermaid code:', mermaidCode);

    res.json({ mermaid: mermaidCode });
  } catch (error) {
    console.error('Error in /api/convert:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

