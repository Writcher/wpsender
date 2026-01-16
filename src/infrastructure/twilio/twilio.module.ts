import { Module } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { SqlServerService } from 'src/infrastructure/database/sqlserver/sqlserver.service';
import { MessengerService } from './messenger/messenger.service';
import { NominaService } from 'src/modules/nomina/nomina.service';
import { RegistrosAccesoService } from 'src/modules/registrosacceso/registroacceso.service';

@Module({
  controllers: [TwilioController],
  providers: [TwilioService, MessengerService, NominaService, RegistrosAccesoService, SqlServerService]
})
export class TwilioModule {}
