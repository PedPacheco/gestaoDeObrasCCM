import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from './interface/modules/auth.module';
import { EmailModule } from './interface/modules/email.module';
import { EntryModule } from './interface/modules/entry.module';
import { ExportModule } from './interface/modules/export.module';
import { FiltersModule } from './interface/modules/filters.module';
import { GoalsModule } from './interface/modules/goals.module';
import { ScheduleModule } from './interface/modules/shedule.module';
import { UsersModule } from './interface/modules/users.module';
import { WorksModule } from './interface/modules/works.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { jwtConstants } from './shared/costants';
import { AuthGuard } from './core/guards/auth.guard';
import { CustomExceptionFilter } from './core/error/customExpection.filter';

@Module({
  imports: [
    WorksModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    EmailModule,
    GoalsModule,
    FiltersModule,
    EntryModule,
    ExportModule,
    ScheduleModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
