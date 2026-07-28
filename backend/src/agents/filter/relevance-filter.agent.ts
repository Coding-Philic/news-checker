import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsItem } from '../../common/types';

@Injectable()
export class RelevanceFilterAgent {
  private readonly logger = new Logger(RelevanceFilterAgent.name);
  private readonly groqApiKey: string;
  private readonly fallbackModels = [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b'
  ];

  constructor(private readonly configService: ConfigService) {
    this.groqApiKey = this.configService.get<string>('groq.apiKey') || '';
  }

  private getModelForSource(sourceName: string): string {
    let hash = 0;
    for (let i = 0; i < sourceName.length; i++) {
      hash = sourceName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.fallbackModels[Math.abs(hash) % this.fallbackModels.length];
  }

  async triageHeadlines(
    items: NewsItem[],
    userCategories: string[],
    sourceName: string,
  ): Promise<NewsItem[]> {
    if (items.length === 0) return [];

    try {
      const model = this.getModelForSource(sourceName);
      this.logger.log(`[Layer 1 Triage] Using model ${model} for ${sourceName} (${items.length} items)`);

      const relevantItems = await this.stage1HeadlineTriage(items, userCategories, sourceName, model);
      this.logger.log(`[Layer 1 Triage] [${sourceName}]: ${items.length} in -> ${relevantItems.length} approved`);
      return relevantItems;
    } catch (error) {
      this.logger.error(`Triage error for ${sourceName}: ${error}`);
      return items.slice(0, 5); // fallback
    }
  }

  truncateForTokenShield(item: NewsItem, maxWords: number = 2000): { title: string; text: string } {
    const rawText = item.summary || item.title || '';
    const words = rawText.trim().split(/\s+/);

    if (words.length <= maxWords) {
      return { title: item.title, text: rawText };
    }

    this.logger.warn(`[Token Shield] Article "${item.title.slice(0, 30)}..." has ${words.length} words (> ${maxWords}). Truncating...`);
    
    // Extract first paragraphs up to 1000 words max to shield token consumption
    const paragraphs = rawText.split(/\n+/);
    let shieldedText = '';
    let currentWords = 0;

    for (const p of paragraphs) {
      const pWords = p.trim().split(/\s+/);
      if (currentWords + pWords.length > 1000) break;
      shieldedText += p + '\n\n';
      currentWords += pWords.length;
    }

    if (!shieldedText.trim()) {
      shieldedText = words.slice(0, 1000).join(' ');
    }

    return { title: item.title, text: shieldedText.trim() };
  }

  async processSummarizationQueue(
    items: NewsItem[],
    defaultCooldownSeconds: number = 15,
  ): Promise<NewsItem[]> {
    if (items.length === 0) return [];

    this.logger.log(`[Layer 4 Queue] Starting FIFO summarization queue for ${items.length} items...`);
    const finalItems: NewsItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sourceName = item.sourceName || 'general';
      const model = this.getModelForSource(sourceName);

      // Layer 3: Token Shield
      const { title, text } = this.truncateForTokenShield(item, 2000);
      const wordCount = text.split(/\s+/).length;

      const prompt = `You are an expert news editor and science communicator. Rewrite this news article so that a normal person can easily understand it without needing domain expertise.

Rules:
1. Rewrite the title to be catchy, engaging, and easy to understand.
2. Write a clear, comprehensive summary (around 120-180 words) that explains what happened, why it matters, and covers ALL the important points and key takeaways from the text.
3. Explain or simplify any complex terminology, technical jargon, or acronyms so anyone can understand it. Use accessible language.
4. The summary MUST have a very natural, conversational, and human flow. Write it exactly as a human storyteller or news anchor would speak it aloud. Avoid any robotic, overly formal, or rigid phrasing.

Title: ${title}
Text: ${text}

Respond in valid JSON format only:
{ "title": "Clear and engaging title", "summary": "An easy-to-understand summary covering all key points..." }`;

      try {
        const response = await this.callGroq(prompt, model, 1500);
        const parsed = this.parseJsonSafely(response);

        finalItems.push({
          ...item,
          title: parsed.title || item.title,
          summary: parsed.summary || item.summary,
        });
      } catch (error) {
        this.logger.warn(`[Queue Worker] Summarization error for item "${item.title.slice(0, 30)}...": ${error}`);
        finalItems.push(item);
      }

      // Layer 4: Cooldown Delay
      if (i < items.length - 1) {
        // Dynamic wait: if article was large (> 1000 words), wait 60s (1 full minute). Otherwise default cooldown.
        const waitSec = wordCount > 1000 ? 60 : defaultCooldownSeconds;
        this.logger.log(`[Queue Worker] Processed ${i + 1}/${items.length} ("${item.title.slice(0, 25)}..."). Cooldown: sleeping for ${waitSec}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
      }
    }

    this.logger.log(`[Layer 4 Queue] Completed summarization for all ${finalItems.length} items.`);
    return finalItems;
  }

  async filterItems(
    items: NewsItem[],
    userCategories: string[],
    sourceName: string,
  ): Promise<NewsItem[]> {
    const triaged = await this.triageHeadlines(items, userCategories, sourceName);
    return this.processSummarizationQueue(triaged, 15);
  }

  private async stage1HeadlineTriage(
    items: NewsItem[],
    userCategories: string[],
    sourceName: string,
    model: string,
  ): Promise<NewsItem[]> {
    const itemsList = items.map((item, idx) => `[${idx}] Title: ${item.title}`).join('\n');

    const prompt = `You are a news relevance filter. Analyze these news headlines from ${sourceName}.
User interests: ${userCategories.join(', ')}

Rules:
- Score each headline 1-10 for relevance to the user's interests.
- Remove spam, clickbait, duplicate content, or irrelevant items.

Headlines:
${itemsList}

Respond in valid JSON format only:
{ "items": [{ "index": 0, "score": 8 }] }`;

    try {
      const response = await this.callGroq(prompt, model, 1000);
      const parsed = this.parseJsonSafely(response);
      const relevantItems: NewsItem[] = [];

      if (parsed.items && Array.isArray(parsed.items)) {
        for (const filtered of parsed.items) {
          const idx = filtered.index;
          if (idx >= 0 && idx < items.length && filtered.score >= 5) {
            const item = items[idx];
            item.relevanceScore = filtered.score;
            relevantItems.push(item);
          }
        }
      }
      return relevantItems;
    } catch (error) {
      this.logger.warn(`Stage 1 error for ${sourceName}: ${error}`);
      return items.slice(0, 5); // fallback to top 5
    }
  }

  private parseJsonSafely(text: string): any {
    // Strip <think>...</think> reasoning blocks from Qwen/DeepSeek models
    let cleanedText = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim();
    if (!cleanedText && text.includes('{')) {
      cleanedText = text;
    }
    try {
      return JSON.parse(cleanedText);
    } catch {
      // Strip markdown code blocks if present
      const cleaned = cleanedText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        // Try finding first { and last }
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          return JSON.parse(cleaned.slice(start, end + 1));
        }
        throw e;
      }
    }
  }

  private async executeGroqRequest(prompt: string, model: string, maxTokens: number, useJsonFormat: boolean): Promise<string> {
    const body: any = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that ALWAYS responds with valid JSON objects. Do NOT include any markdown code blocks, preamble, or explanations. Return strictly valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    };

    if (useJsonFormat) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      const errObj = new Error(`Groq error ${response.status}: ${errText}`) as any;
      errObj.status = response.status;
      errObj.errText = errText;
      throw errObj;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned');
    
    return content;
  }

  private async callGroq(prompt: string, initialModel: string, maxTokens: number, useJsonFormat = true): Promise<string> {
    const modelsToTry = [initialModel, ...this.fallbackModels.filter(m => m !== initialModel)];

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        return await this.executeGroqRequest(prompt, model, maxTokens, useJsonFormat);
      } catch (error: any) {
        const errText = error.errText || error.message || '';
        const status = error.status;

        if (useJsonFormat && (errText.includes('json_validate_failed') || errText.includes('invalid_request_error') || status === 400)) {
          this.logger.warn(`Groq strict JSON format validation failed for ${model}. Retrying without strict response_format...`);
          try {
            return await this.executeGroqRequest(prompt, model, maxTokens, false);
          } catch (retryError: any) {
            if (retryError.status === 429 || retryError.status >= 500) {
              this.logger.warn(`Model ${model} failed after strict retry with status ${retryError.status}.`);
              if (i < modelsToTry.length - 1) continue;
            }
            throw retryError;
          }
        }

        if (status === 429 || status >= 500 || (error.message && error.message.includes('fetch failed'))) {
          this.logger.warn(`Model ${model} failed with status ${status || 'network error'}: ${errText}.`);
          if (i < modelsToTry.length - 1) {
            this.logger.log(`Falling back to next model: ${modelsToTry[i + 1]}`);
            continue;
          }
        }

        throw error;
      }
    }
    
    throw new Error('All fallback models failed.');
  }
}
