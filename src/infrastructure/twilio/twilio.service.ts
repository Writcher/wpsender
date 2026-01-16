import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
    private twilioClient: Twilio;
    private configService: ConfigService;

    constructor(configService: ConfigService) {
        this.configService = configService;

        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

        this.twilioClient = new Twilio(accountSid, authToken);
    };

    async sendMessage(to: string, contentSid: string, variables: any) {
        try {
            const cleanTo = to.replace('whatsapp:', '').trim();

            const message = await this.twilioClient.messages.create({
                contentSid: contentSid,
                contentVariables: JSON.stringify(variables),
                from: this.configService.get<string>('TWILIO_WHATSAPP_FROM'),
                to: `whatsapp:${cleanTo}`
            });

            return {
                success: true,
                messageSid: message.sid,
                status: message.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        };
    };
};
