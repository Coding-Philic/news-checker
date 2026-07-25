import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrchestratorService } from '../agents/orchestrator/orchestrator.service';
import { UsersService } from '../users/users.service';

@Controller('api/news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly orchestratorService: OrchestratorService,
    private readonly usersService: UsersService,
  ) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getUserFeed(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('source') source?: string,
  ) {
    return this.newsService.getUserFeed(userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      category,
      source,
    });
  }

  @Get('public')
  async getPublicFeed(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    return this.newsService.getPublicFeed({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      category,
    });
  }

  @Post('trigger-welcome')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerWelcomeSearch(@CurrentUser('id') userId: string) {
    const userProfile = await this.usersService.getProfile(userId);
    if (!userProfile) {
      return { error: 'User profile not found' };
    }

    // Run as 'scheduled' so that it triggers distribution to email/telegram
    const runPromise = this.orchestratorService.runForUser(userProfile, 'scheduled');

    runPromise.catch((error) => {
      console.error(`Background welcome run failed for user ${userId}:`, error);
    });

    return {
      message: 'Welcome digest triggered successfully',
      status: 'running',
    };
  }

  @Post('trigger')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerSearch(@CurrentUser('id') userId: string) {
    const userProfile = await this.usersService.getProfile(userId);
    if (!userProfile) {
      return { error: 'User profile not found' };
    }

    // Run asynchronously — return immediately with run ID
    const runPromise = this.orchestratorService.runForUser(userProfile, 'manual');

    // Don't await — let it run in background
    runPromise.catch((error) => {
      console.error(`Background run failed for user ${userId}:`, error);
    });

    return {
      message: 'News search triggered successfully. Check status for updates.',
      status: 'running',
    };
  }

  @Get('status/:runId')
  @UseGuards(JwtAuthGuard)
  async getRunStatus(@Param('runId') runId: string) {
    return this.orchestratorService.getRunStatus(runId);
  }

  @Post('read/:feedItemId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('feedItemId') feedItemId: string,
  ) {
    return this.newsService.markAsRead(userId, feedItemId);
  }

  @Get('article/:id')
  async getArticle(@Param('id') id: string) {
    const article = await this.newsService.getArticleById(id);
    if (!article) {
      return { error: 'Article not found' };
    }
    return { data: article };
  }
}
