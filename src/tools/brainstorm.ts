/**
 * grok_brainstorm Tool Implementation
 *
 * Creative brainstorming using Grok AI
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type {
  GrokBrainstormInput,
  GrokBrainstormOutput,
} from '../types/index.js';
import {
  createResponse,
  extractContent,
  extractUsage,
  calculateCost,
} from '../utils/grok-client.js';
import { xaiConfig, debugMode, SUPPORTED_MODELS } from '../config/index.js';

/**
 * Style description mapping
 */
const STYLE_DESCRIPTIONS: Record<string, string> = {
  innovative: 'Innovative: Pursue novel and unique ideas, encourage thinking outside the box',
  practical: 'Practical: Focus on feasibility and ROI, prioritize actionable solutions',
  radical: 'Radical: Break conventional thinking, boldly challenge existing assumptions, explore disruptive solutions',
  balanced: 'Balanced: Balance innovation with feasibility, analyze from multiple dimensions',
};

/**
 * Read project file contents
 */
async function readContextFiles(files: string[]): Promise<string> {
  const contents: string[] = [];

  for (const filePath of files) {
    try {
      const absolutePath = resolve(filePath);
      const content = await readFile(absolutePath, 'utf-8');
      // Limit each file to 5000 chars to avoid token explosion
      const truncated = content.length > 5000
        ? content.slice(0, 5000) + '\n... (file truncated, original length: ' + content.length + ' chars)'
        : content;
      contents.push(`--- File: ${filePath} ---\n${truncated}`);
    } catch (error) {
      console.error(`[Brainstorm] Failed to read file ${filePath}:`, error instanceof Error ? error.message : error);
      contents.push(`--- File: ${filePath} ---\n(read failed)`);
    }
  }

  return contents.join('\n\n');
}

/**
 * Validate model name is supported
 */
function resolveModel(model?: string): string {
  if (!model) return xaiConfig.defaultModel;
  if ((SUPPORTED_MODELS as readonly string[]).includes(model)) return model;
  console.error(`[Brainstorm] Unsupported model "${model}", falling back to default ${xaiConfig.defaultModel}`);
  return xaiConfig.defaultModel;
}

/**
 * Build brainstorm prompt
 *
 * @param input - Brainstorm input parameters
 * @param fileContents - Project file contents (optional)
 * @returns Prompt string
 */
function buildBrainstormPrompt(input: GrokBrainstormInput, fileContents?: string): string {
  const count = input.count || 5;
  const style = input.style || 'balanced';
  const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.balanced;
  const outputFormat = input.output_format || 'text';

  let prompt = `You are a creative thinking expert, skilled at analyzing problems from multiple angles and generating innovative ideas.

**Thinking Style**: ${styleDesc}

Please brainstorm on the following topic:

**Topic**: ${input.topic}
`;

  if (input.context) {
    prompt += `\n**Background**: ${input.context}\n`;
  }

  if (fileContents) {
    prompt += `\n**Project File Reference**:\n${fileContents}\n`;
  }

  prompt += `\nPlease generate **${count}** creative ideas`;

  if (outputFormat === 'json') {
    // JSON format output requirements
    prompt += `, and strictly return in the following JSON format (do not include markdown code block markers):
{"ideas": [{"title": "Idea title", "description": "Detailed description", "pros": ["Pro 1", "Pro 2"], "cons": ["Challenge 1"], "feasibility": "high or medium or low", "implementation": "Implementation suggestions"}]}`;
  } else {
    // Markdown format output requirements
    prompt += `. Each idea should include:
1. **Title**: A concise and impactful title
2. **Description**: Detailed explanation of the core idea
3. **Pros**: List at least 2-3 advantages
4. **Potential Challenges**: List 1-2 possible challenges
5. **Feasibility Assessment**: High / Medium / Low
6. **Implementation Suggestions**: Specific steps or recommendations

Please consider the following perspectives:
- **Innovation**: Any unique angles or approaches?
- **Feasibility**: Implementation difficulty and required resources
- **Impact**: Potential impact on target users or business
- **Scalability**: Room for future growth

Please present your ideas in a clear, structured manner.`;
  }

  return prompt;
}

/**
 * grok_brainstorm main function
 *
 * @param input - Brainstorm input parameters
 * @returns Brainstorm result
 */
export async function grokBrainstorm(
  input: GrokBrainstormInput
): Promise<GrokBrainstormOutput> {
  try {
    const model = resolveModel(input.model);

    if (debugMode) {
      console.error('[Brainstorm] Starting brainstorm:', input.topic);
      console.error('[Brainstorm] Model:', model);
      console.error('[Brainstorm] Count:', input.count || 5);
      console.error('[Brainstorm] Style:', input.style || 'balanced');
      console.error('[Brainstorm] Output format:', input.output_format || 'text');
      if (input.context) {
        console.error('[Brainstorm] Context:', input.context);
      }
      if (input.context_files) {
        console.error('[Brainstorm] Context files:', input.context_files);
      }
    }

    // 1. Read project files (if specified)
    let fileContents: string | undefined;
    if (input.context_files && input.context_files.length > 0) {
      if (debugMode) {
        console.error('[Brainstorm] Reading project files...');
      }
      fileContents = await readContextFiles(input.context_files);
    }

    // 2. Build prompt
    const prompt = buildBrainstormPrompt(input, fileContents);

    // 3. Call Grok API (without search tools)
    if (debugMode) {
      console.error('[Brainstorm] Calling Grok API...');
    }

    // Adjust temperature based on style
    let temperature: number | undefined;
    switch (input.style) {
      case 'radical':
        temperature = 1.2; // Higher randomness, encourage bold ideas
        break;
      case 'innovative':
        temperature = 0.9; // Moderate creativity
        break;
      case 'practical':
        temperature = 0.5; // More conservative, focus on feasibility
        break;
      // balanced and default: no temperature set, use model default
    }

    const response = await createResponse({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      // No search tools — purely relying on Grok's creative thinking
    });

    // 4. Extract results
    const content = extractContent(response);
    const usage = extractUsage(response);
    const cost = calculateCost(response);

    if (debugMode) {
      console.error('[Brainstorm] Brainstorm completed');
      console.error('[Brainstorm] Model:', model);
      console.error('[Brainstorm] Token usage:', usage.total_tokens);
      console.error('[Brainstorm] Reasoning tokens:', usage.reasoning_tokens);
      console.error('[Brainstorm] Cost:', `$${cost.toFixed(6)}`);
    }

    // 5. Return result
    return {
      content,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        reasoning_tokens: usage.reasoning_tokens,
        total_tokens: usage.total_tokens,
      },
    };
  } catch (error) {
    // Error handling
    if (error instanceof Error) {
      console.error('[Brainstorm] Brainstorm failed:', error.message);

      // Timeout error
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new Error(
          `Brainstorm timed out. Suggestions:\n` +
            `1. Simplify the topic description\n` +
            `2. Reduce context or file count\n` +
            `3. Try again later\n` +
            `Original error: ${error.message}`
        );
      }

      // API error
      if (error.message.includes('API') || error.message.includes('401')) {
        throw new Error(
          `API call failed. Please check:\n` +
            `1. Is XAI_API_KEY configured correctly?\n` +
            `2. Is the API key valid?\n` +
            `3. Is the network connection working?\n` +
            `Original error: ${error.message}`
        );
      }

      // Other errors
      throw new Error(`Brainstorm failed: ${error.message}`);
    }

    throw error;
  }
}
