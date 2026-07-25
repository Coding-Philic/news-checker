import { ConfigService } from '@nestjs/config';
import { NewsItem } from '../../common/types';
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    private readonly fromEmail;
    constructor(configService: ConfigService);
    sendNewsDigest(toEmail: string, items: NewsItem[], categories: string[]): Promise<boolean>;
    private buildHtmlEmail;
}
