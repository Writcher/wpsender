import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwilioModule } from './infrastructure/twilio/twilio.module';
import { SqlServerService } from './infrastructure/database/sqlserver/sqlserver.service';
import { NominaService } from './modules/nomina/nomina.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TwilioModule
  ],
  providers: [SqlServerService, NominaService],
})
export class AppModule {}
