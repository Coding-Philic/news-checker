"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RelevanceFilterAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelevanceFilterAgent = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RelevanceFilterAgent = RelevanceFilterAgent_1 = class RelevanceFilterAgent {
    configService;
    logger = new common_1.Logger(RelevanceFilterAgent_1.name);
    groqApiKey;
    fallbackModels = [
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.6-27b'
    ];
    constructor(configService) {
        this.configService = configService;
        this.groqApiKey = this.configService.get('groq.apiKey') || '';
    }
    getModelForSource(sourceName) {
        let hash = 0;
        for (let i = 0; i < sourceName.length; i++) {
            hash = sourceName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return this.fallbackModels[Math.abs(hash) % this.fallbackModels.length];
    }
    async triageHeadlines(items, userCategories, sourceName) {
        if (items.length === 0)
            return [];
        try {
            const model = this.getModelForSource(sourceName);
            this.logger.log(`[Layer 1 Triage] Using model ${model} for ${sourceName} (${items.length} items)`);
            const relevantItems = await this.stage1HeadlineTriage(items, userCategories, sourceName, model);
            this.logger.log(`[Layer 1 Triage] [${sourceName}]: ${items.length} in -> ${relevantItems.length} approved`);
            return relevantItems;
        }
        catch (error) {
            this.logger.error(`Triage error for ${sourceName}: ${error}`);
            return items.slice(0, 5);
        }
    }
    truncateForTokenShield(item, maxWords = 2000) {
        const rawText = item.summary || item.title || '';
        const words = rawText.trim().split(/\s+/);
        if (words.length <= maxWords) {
            return { title: item.title, text: rawText };
        }
        this.logger.warn(`[Token Shield] Article "${item.title.slice(0, 30)}..." has ${words.length} words (> ${maxWords}). Truncating...`);
        const paragraphs = rawText.split(/\n+/);
        let shieldedText = '';
        let currentWords = 0;
        for (const p of paragraphs) {
            const pWords = p.trim().split(/\s+/);
            if (currentWords + pWords.length > 1000)
                break;
            shieldedText += p + '\n\n';
            currentWords += pWords.length;
        }
        if (!shieldedText.trim()) {
            shieldedText = words.slice(0, 1000).join(' ');
        }
        return { title: item.title, text: shieldedText.trim() };
    }
    async processSummarizationQueue(items, defaultCooldownSeconds = 15) {
        if (items.length === 0)
            return [];
        this.logger.log(`[Layer 4 Queue] Starting FIFO summarization queue for ${items.length} items...`);
        const finalItems = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const sourceName = item.sourceName || 'general';
            const model = this.getModelForSource(sourceName);
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
            }
            catch (error) {
                this.logger.warn(`[Queue Worker] Summarization error for item "${item.title.slice(0, 30)}...": ${error}`);
                finalItems.push(item);
            }
            if (i < items.length - 1) {
                const waitSec = wordCount > 1000 ? 60 : defaultCooldownSeconds;
                this.logger.log(`[Queue Worker] Processed ${i + 1}/${items.length} ("${item.title.slice(0, 25)}..."). Cooldown: sleeping for ${waitSec}s...`);
                await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
            }
        }
        this.logger.log(`[Layer 4 Queue] Completed summarization for all ${finalItems.length} items.`);
        return finalItems;
    }
    async filterItems(items, userCategories, sourceName) {
        const triaged = await this.triageHeadlines(items, userCategories, sourceName);
        return this.processSummarizationQueue(triaged, 15);
    }
    async stage1HeadlineTriage(items, userCategories, sourceName, model) {
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
            const relevantItems = [];
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
        }
        catch (error) {
            this.logger.warn(`Stage 1 error for ${sourceName}: ${error}`);
            return items.slice(0, 5);
        }
    }
    parseJsonSafely(text) {
        let cleanedText = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim();
        if (!cleanedText && text.includes('{')) {
            cleanedText = text;
        }
        try {
            return JSON.parse(cleanedText);
        }
        catch {
            const cleaned = cleanedText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
            try {
                return JSON.parse(cleaned);
            }
            catch (e) {
                const start = cleaned.indexOf('{');
                const end = cleaned.lastIndexOf('}');
                if (start !== -1 && end !== -1 && end > start) {
                    return JSON.parse(cleaned.slice(start, end + 1));
                }
                throw e;
            }
        }
    }
    async executeGroqRequest(prompt, model, maxTokens, useJsonFormat) {
        const body = {
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
            const errObj = new Error(`Groq error ${response.status}: ${errText}`);
            errObj.status = response.status;
            errObj.errText = errText;
            throw errObj;
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content)
            throw new Error('No content returned');
        return content;
    }
    async callGroq(prompt, initialModel, maxTokens, useJsonFormat = true) {
        const modelsToTry = [initialModel, ...this.fallbackModels.filter(m => m !== initialModel)];
        for (let i = 0; i < modelsToTry.length; i++) {
            const model = modelsToTry[i];
            try {
                return await this.executeGroqRequest(prompt, model, maxTokens, useJsonFormat);
            }
            catch (error) {
                const errText = error.errText || error.message || '';
                const status = error.status;
                if (useJsonFormat && (errText.includes('json_validate_failed') || errText.includes('invalid_request_error') || status === 400)) {
                    this.logger.warn(`Groq strict JSON format validation failed for ${model}. Retrying without strict response_format...`);
                    try {
                        return await this.executeGroqRequest(prompt, model, maxTokens, false);
                    }
                    catch (retryError) {
                        if (retryError.status === 429 || retryError.status >= 500) {
                            this.logger.warn(`Model ${model} failed after strict retry with status ${retryError.status}.`);
                            if (i < modelsToTry.length - 1)
                                continue;
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
};
exports.RelevanceFilterAgent = RelevanceFilterAgent;
exports.RelevanceFilterAgent = RelevanceFilterAgent = RelevanceFilterAgent_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RelevanceFilterAgent);
//# sourceMappingURL=relevance-filter.agent.js.map