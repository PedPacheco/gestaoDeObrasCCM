import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { CustomExceptionFilter } from './core/error/customExpection.filter';
import { AuthGuard } from './core/guards/auth.guard';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from './interface/modules/auth.module';
import { AuxiliaryBaseModule } from './interface/modules/auxiliaryBase.module';
import { EmailModule } from './interface/modules/email.module';
import { EntryModule } from './interface/modules/entry.module';
import { ExportModule } from './interface/modules/export.module';
import { FiltersModule } from './interface/modules/filters.module';
import { GoalsModule } from './interface/modules/goals.module';
import { ScheduleModule } from './interface/modules/schedule.module';
import { UsersModule } from './interface/modules/users.module';
import { WorksModule } from './interface/modules/works.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExecutionReportModule } from './interface/modules/executionReport.module';
import { ExecutionCapacityModule } from './interface/modules/executionCapacity.module';
import { ErrorsReportModule } from './interface/modules/errorsReport.module';
import { RestrictionsModule } from './interface/modules/restrictions.module';
import { FeasibilityModule } from './interface/modules/feasibility.module';
import { CustomValidationPipe } from './core/pipes/customValidation.pipe';
import { EquipamentosModule } from './interface/modules/equipamentos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    WorksModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    EmailModule,
    GoalsModule,
    FiltersModule,
    FeasibilityModule,
    EntryModule,
    ExportModule,
    ScheduleModule,
    ExecutionReportModule,
    AuxiliaryBaseModule,
    ExecutionCapacityModule,
    ErrorsReportModule,
    RestrictionsModule,
    EquipamentosModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRECT');
        return {
          secret,
          signOptions: { expiresIn: '6h' },
        };
      },
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
      useValue: new CustomValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
