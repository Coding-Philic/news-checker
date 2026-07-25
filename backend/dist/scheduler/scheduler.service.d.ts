import { OrchestratorService } from '../agents/orchestrator/orchestrator.service';
import { UsersService } from '../users/users.service';
export declare class SchedulerService {
    private readonly orchestratorService;
    private readonly usersService;
    private readonly logger;
    private isRunning;
    constructor(orchestratorService: OrchestratorService, usersService: UsersService);
    handleDailyDigest(): Promise<void>;
}
