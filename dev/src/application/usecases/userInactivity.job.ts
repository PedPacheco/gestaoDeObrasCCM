import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { UsersService } from './users.service';

@Injectable()
export class UserInactivityJob {
  private readonly logger = new Logger(UserInactivityJob.name);

  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'America/Sao_Paulo' })
  async handleInactiveUsersDeactivation(): Promise<void> {
    const deactivatedCount = await this.usersService.deactivateInactiveUsers();

    this.logger.log(
      `${deactivatedCount} usuário(s) desativado(s) por inatividade`,
    );
  }
}
