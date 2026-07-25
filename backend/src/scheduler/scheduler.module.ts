import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { AgentsModule } from '../agents/agents.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ScheduleModule.forRoot(), AgentsModule, UsersModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
