"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const orchestrator_service_1 = require("../agents/orchestrator/orchestrator.service");
const users_service_1 = require("../users/users.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    orchestratorService;
    usersService;
    logger = new common_1.Logger(SchedulerService_1.name);
    isRunning = false;
    constructor(orchestratorService, usersService) {
        this.orchestratorService = orchestratorService;
        this.usersService = usersService;
    }
    async handleDailyDigest() {
        if (this.isRunning) {
            return;
        }
        const now = new Date();
        const timeString = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(now) + ':00';
        this.isRunning = true;
        try {
            const users = await this.usersService.getAllUsersWithInterests(timeString);
            if (users.length > 0) {
                this.logger.log(`Found ${users.length} users with scheduled time ${timeString}`);
            }
            for (const user of users) {
                try {
                    this.logger.log(`Running digest for user ${user.id} (${user.displayName})`);
                    await this.orchestratorService.runForUser(user, 'scheduled');
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
                catch (error) {
                    this.logger.error(`Failed digest for user ${user.id}: ${error}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Daily digest failed: ${error}`);
        }
        finally {
            this.isRunning = false;
        }
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)('* * * * *', { timeZone: 'Asia/Kolkata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handleDailyDigest", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [orchestrator_service_1.OrchestratorService,
        users_service_1.UsersService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map