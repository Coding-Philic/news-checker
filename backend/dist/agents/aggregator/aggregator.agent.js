"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AggregatorAgent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatorAgent = void 0;
const common_1 = require("@nestjs/common");
let AggregatorAgent = AggregatorAgent_1 = class AggregatorAgent {
    logger = new common_1.Logger(AggregatorAgent_1.name);
    aggregate(allFilteredResults) {
        const allItems = [];
        for (const [source, items] of Object.entries(allFilteredResults)) {
            this.logger.log(`Aggregating ${items.length} items from ${source}`);
            allItems.push(...items);
        }
        const seenHashes = new Set();
        const deduped = [];
        for (const item of allItems) {
            if (item.contentHash && seenHashes.has(item.contentHash)) {
                continue;
            }
            if (item.contentHash) {
                seenHashes.add(item.contentHash);
            }
            deduped.push(item);
        }
        const finalItems = [];
        for (const item of deduped) {
            const isDuplicate = finalItems.some((existing) => this.similarity(existing.title, item.title) > 0.75);
            if (!isDuplicate) {
                finalItems.push(item);
            }
        }
        finalItems.sort((a, b) => {
            const scoreA = a.relevanceScore || 5;
            const scoreB = b.relevanceScore || 5;
            if (scoreB !== scoreA)
                return scoreB - scoreA;
            const dateA = new Date(a.publishedAt || 0).getTime();
            const dateB = new Date(b.publishedAt || 0).getTime();
            return dateB - dateA;
        });
        const byCategory = new Map();
        for (const item of finalItems) {
            const cat = item.categorySlug || 'general';
            if (!byCategory.has(cat))
                byCategory.set(cat, []);
            const catItems = byCategory.get(cat);
            if (catItems.length < 15) {
                catItems.push(item);
            }
        }
        const result = [];
        for (const items of byCategory.values()) {
            result.push(...items);
        }
        this.logger.log(`Aggregation: ${allItems.length} total -> ${deduped.length} deduped -> ${result.length} final`);
        return result;
    }
    similarity(a, b) {
        const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
        const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
        if (wordsA.size === 0 || wordsB.size === 0)
            return 0;
        let intersection = 0;
        for (const word of wordsA) {
            if (wordsB.has(word))
                intersection++;
        }
        const union = new Set([...wordsA, ...wordsB]).size;
        return union === 0 ? 0 : intersection / union;
    }
};
exports.AggregatorAgent = AggregatorAgent;
exports.AggregatorAgent = AggregatorAgent = AggregatorAgent_1 = __decorate([
    (0, common_1.Injectable)()
], AggregatorAgent);
//# sourceMappingURL=aggregator.agent.js.map