import { Injectable } from "@nestjs/common";
import { TwilioService } from "../twilio.service";
import { ConfigService } from "@nestjs/config";
import { NominaService } from "src/modules/nomina/nomina.service";
import { EmployeeRecords, RegistrosAccesoService } from "src/modules/registrosacceso/registroacceso.service";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class MessengerService {
    constructor(
        private configService: ConfigService,
        private twilioService: TwilioService,
        private nominaService: NominaService,
        private registrosAccesoService: RegistrosAccesoService
    ) { }

    async sendReportsToAll() {
        //Get all active uocra employees with phone numbers
        const employees = await this.nominaService.getUocraEmployeesInfo();
        //Go through each employee
        for (const employee of employees) {
            //Get employee access records
            const records = await this.registrosAccesoService.getEmployeeRecords(employee.dni);
            //Construct message
            if (records.length === 0) {
                continue;
            };
            const reportVariables = this.buildReportVariables(records);
            //Format phone number
            const cleanedPhone = employee.telefono.replace(/\s/g, "");
            const formatedPhone = `+549${cleanedPhone}`;
            //Send message
            const template = this.configService.get<string>('TWILIO_HOUR_TEMPLATE_ID');
            const variables = {
                "1": employee.apellido + ' ' + employee.nombre + ' - DNI: ' + employee.dni,
                "2": reportVariables["1"],
                "3": reportVariables["2"],
                "4": reportVariables["3"]
            };
            try {
                await this.twilioService.sendMessage(formatedPhone, template!, variables);
            } catch (error) {
                console.error(`Failed to send message to DNI: ${employee.dni}:`, error);
            };
        };
    };

    async sendTargetedReport(dni: string) {
        try {
            //Get employee data from dni
            const employee = await this.nominaService.getEmployeeInfo(dni);
            //get employee access records
            const records = await this.registrosAccesoService.getEmployeeRecords(dni);
            //Construct message
            if (records.length === 0) {
                return { success: false, message: 'No records found' };
            };
            const reportVariables = this.buildReportVariables(records);
            //Format phone number
            const cleanedPhone = employee.telefono.replace(/\s/g, "");
            const formatedPhone = `+549${cleanedPhone}`;
            //Send message
            const template = this.configService.get<string>('TWILIO_HOUR_TEMPLATE_ID');
            const variables = {
                "1": employee.apellido + ' ' + employee.nombre + ' - DNI: ' + dni,
                "2": reportVariables["1"],
                "3": reportVariables["2"],
                "4": reportVariables["3"]
            };

            await this.twilioService.sendMessage(formatedPhone, template!, variables);
            return { success: true, message: 'Message sent' };
        } catch (error) {
            console.error(`Failed to send message to DNI: ${dni}:`, error);
            return { success: false, message: error.message };
        };
    };

    private formatTime(timeString: string): string {
        if (!timeString) return 'N/A';
        return timeString.substring(0, 5);
    };

    private formatDate(fecha: string): string {
        const [year, month, day] = fecha.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${dias[date.getDay()]} ${day} ${meses[month - 1]}`;
    };

    private buildReportVariables(records: EmployeeRecords[]): { "1": string, "2": string, "3": string } {
        const recordsPerVariable = Math.ceil(records.length / 3);

        const chunks = [
            records.slice(0, recordsPerVariable),
            records.slice(recordsPerVariable, recordsPerVariable * 2),
            records.slice(recordsPerVariable * 2)
        ];

        const formatChunk = (chunk: EmployeeRecords[]): string => {
            return chunk.map(record =>
                '[' + this.formatDate(record.fecha_acceso) + '] ' +
                'Entrada: ' + this.formatTime(record.primera_hora) + ' / ' +
                'Salida: ' + this.formatTime(record.ultima_hora)
            ).join(' • ');
        };

        return {
            "1": formatChunk(chunks[0]),
            "2": formatChunk(chunks[1]),
            "3": formatChunk(chunks[2])
        };
    };

    @Cron('0 9 * * 1', {
        timeZone: 'America/Argentina/Buenos_Aires'
    })
    async scheduledWeeklyReport() {
        console.log('Running scheduled report...');
        try {
            await this.sendReportsToAll();
            console.log('Reports sent');
        } catch (error) {
            console.error('Scheduled report failed: ', error);
        };
    };
};