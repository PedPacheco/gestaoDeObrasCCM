import { Module, ValidationPipe } from '@nestjs/common';
import { PrismaModule } from './config/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard';
import { UsersModule } from './modules/users/users.module';
import { EmailModule } from './modules/email/email.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './config/costants';
import { GoalsModule } from './modules/goals/goals.module';
import { InternalServerErrorExceptionFilter } from './utils/internalServerError.filter';
import { FiltersModule } from './modules/filters/filters.module';
import { EntryModule } from './modules/entry/entry.module';
import { WorksModule } from './modules/works/works.module';

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
      useClass: InternalServerErrorExceptionFilter,
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
