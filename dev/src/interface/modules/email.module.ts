import { EmailService } from 'src/domain/services/email.service';
import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';

@Module({
  imports: [CacheModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
