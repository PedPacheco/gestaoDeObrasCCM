import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { CustomExceptionFilter } from './core/error/customExpection.filter';
import { AuthGuard } from './core/guards/auth.guard';
import { CustomValidationPipe } from './core/pipes/customValidation.pipe';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AdvancePartnerModule } from './interface/modules/advancePartner.module';
import { AuthModule } from './interface/modules/auth.module';
import { AuxiliaryBaseModule } from './interface/modules/auxiliaryBase.module';
import { DashboardModule } from './interface/modules/dashboard.module';
import { EmailModule } from './interface/modules/email.module';
import { EntryModule } from './interface/modules/entry.module';
import { EquipmentsModule } from './interface/modules/equipments.module';
import { ErrorsReportModule } from './interface/modules/errorsReport.module';
import { ExecutionCapacityModule } from './interface/modules/executionCapacity.module';
import { ExecutionReportModule } from './interface/modules/executionReport.module';
import { ExportModule } from './interface/modules/export.module';
import { FeasibilityModule } from './interface/modules/feasibility.module';
import { FiltersModule } from './interface/modules/filters.module';
import { ForecastModule } from './interface/modules/forecast.module';
import { GoalsModule } from './interface/modules/goals.module';
import { RestrictionsModule } from './interface/modules/restrictions.module';
import { ScheduleModule } from './interface/modules/schedule.module';
import { UsersModule } from './interface/modules/users.module';
import { WorksModule } from './interface/modules/works.module';

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
    DashboardModule,
    EquipmentsModule,
    ForecastModule,
    AdvancePartnerModule,
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
