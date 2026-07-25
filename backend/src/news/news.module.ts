import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [ConfigModule, AuthModule, UsersModule, AgentsModule],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
