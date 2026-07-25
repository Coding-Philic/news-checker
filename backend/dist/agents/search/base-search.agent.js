"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSearchAgent = void 0;
class BaseSearchAgent {
    createHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    cleanText(text) {
        return text
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }
    truncate(text, maxLength = 500) {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
    }
}
exports.BaseSearchAgent = BaseSearchAgent;
//# sourceMappingURL=base-search.agent.js.map