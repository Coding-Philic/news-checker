import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrchestratorService } from '../agents/orchestrator/orchestrator.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private isRunning = false;

  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly usersService: UsersService,
  ) {}

  // Run every minute and check for users whose scheduled time matches the current minute
  @Cron('* * * * *', { timeZone: 'Asia/Kolkata' })
  async handleDailyDigest() {
    if (this.isRunning) {
      return;
    }

    const now = new Date();
    // Get current time in Asia/Kolkata as HH:mm:00
    const timeString = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now) + ':00';

    this.isRunning = true;

    try {
      // Find users whose schedule_time matches the current minute exactly
      const users = await this.usersService.getAllUsersWithInterests(timeString);
      
      if (users.length > 0) {
        this.logger.log(`Found ${users.length} users with scheduled time ${timeString}`);
      }

      for (const user of users) {
        try {
          this.logger.log(`Running digest for user ${user.id} (${user.displayName})`);
          await this.orchestratorService.runForUser(user, 'scheduled');

          // Delay between users to avoid hitting rate limits
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          this.logger.error(`Failed digest for user ${user.id}: ${error}`);
        }
      }
    } catch (error) {
      this.logger.error(`Daily digest failed: ${error}`);
    } finally {
      this.isRunning = false;
    }
  }
}
