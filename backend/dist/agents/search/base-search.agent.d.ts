import { NewsItem } from '../../common/types';
export declare abstract class BaseSearchAgent {
    abstract readonly name: string;
    abstract readonly platform: string;
    abstract search(keywords: string[], categories: string[]): Promise<NewsItem[]>;
    protected createHash(text: string): string;
    protected cleanText(text: string): string;
    protected truncate(text: string, maxLength?: number): string;
}
