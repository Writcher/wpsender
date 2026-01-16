import { Body, Controller, Post } from '@nestjs/common';
import { MessengerService } from './messenger/messenger.service';

@Controller('twilio')
export class TwilioController {
    constructor(
        private readonly messengerService: MessengerService,
    ) {}

    @Post('send-to-all')
    async sentToAll() {
        const result = await this.messengerService.sendReportsToAll();
        return result;
    };

    @Post('send-to-target')
    async sendToTarget(@Body() body: { dni: string }) {
        if (!body.dni) {
            return { success: false, message: 'DNI is required' };
        };
        const result = await this.messengerService.sendTargetedReport(body.dni);
        return result;
    };
};
