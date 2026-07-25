import { Injectable, Logger } from '@nestjs/common';
import { NewsItem } from '../../common/types';

@Injectable()
export class AggregatorAgent {
  private readonly logger = new Logger(AggregatorAgent.name);

  aggregate(allFilteredResults: Record<string, NewsItem[]>): NewsItem[] {
    const allItems: NewsItem[] = [];

    // Collect all items from all sources
    for (const [source, items] of Object.entries(allFilteredResults)) {
      this.logger.log(`Aggregating ${items.length} items from ${source}`);
      allItems.push(...items);
    }

    // Deduplicate by content hash
    const seenHashes = new Set<string>();
    const deduped: NewsItem[] = [];

    for (const item of allItems) {
      if (item.contentHash && seenHashes.has(item.contentHash)) {
        continue;
      }
      if (item.contentHash) {
        seenHashes.add(item.contentHash);
      }
      deduped.push(item);
    }

    // Deduplicate by title similarity
    const finalItems: NewsItem[] = [];
    for (const item of deduped) {
      const isDuplicate = finalItems.some(
        (existing) => this.similarity(existing.title, item.title) > 0.75,
      );
      if (!isDuplicate) {
        finalItems.push(item);
      }
    }

    // Sort by relevance score (descending), then by recency
    finalItems.sort((a, b) => {
      const scoreA = a.relevanceScore || 5;
      const scoreB = b.relevanceScore || 5;
      if (scoreB !== scoreA) return scoreB - scoreA;

      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return dateB - dateA;
    });

    // Group by category and limit per category
    const byCategory = new Map<string, NewsItem[]>();
    for (const item of finalItems) {
      const cat = item.categorySlug || 'general';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      const catItems = byCategory.get(cat)!;
      if (catItems.length < 15) {
        catItems.push(item);
      }
    }

    // Flatten back
    const result: NewsItem[] = [];
    for (const items of byCategory.values()) {
      result.push(...items);
    }

    this.logger.log(
      `Aggregation: ${allItems.length} total -> ${deduped.length} deduped -> ${result.length} final`,
    );

    return result;
  }

  private similarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) intersection++;
    }

    const union = new Set([...wordsA, ...wordsB]).size;
    return union === 0 ? 0 : intersection / union;
  }
}
