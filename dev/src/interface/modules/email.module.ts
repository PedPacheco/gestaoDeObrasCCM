import { CacheModule } from 'src/infra/cache/cache.module';

import { Module } from '@nestjs/common';
import { EmailService } from 'src/application/usecases/email.service';

@Module({
  imports: [CacheModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
