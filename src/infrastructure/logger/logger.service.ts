import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import * as path from 'path';

export class LoggerService {
    private logDir = path.join(process.cwd(), 'logs');
    private reportLogFile = path.join(this.logDir, 'twilio-reports.log');

    constructor() {
        if (!fsSync.existsSync(this.logDir)) {
            fsSync.mkdirSync(this.logDir, { recursive: true });
        };
    };

    private formatTimestamp(): string {
        const now = new Date();
        return now.toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    private writeToFile(message: string): void {
        const timestamp = this.formatTimestamp();
        const logMessage = `[${timestamp}] ${message}\n`;
        fsSync.appendFileSync(this.reportLogFile, logMessage);
    };

    logReportStart(employeeCount: number): void {
        this.writeToFile('═══════════════════════════════════════════════════');
        this.writeToFile(`Scheduled Report - ${employeeCount} employees to process`);
    };

    logSuccess(dni: string, phone: string): void {
        this.writeToFile(`SUCCESS - DNI: ${dni} | Phone: ${phone}`);
    };

    logFailure(dni: string, phone: string, reason: string, error?: string): void {
        this.writeToFile(`FAILED - DNI: ${dni} | Phone: ${phone} | Reason: ${reason}${error ? ` | Error: ${error}` : ''}`);
    };

    logSkipped(dni: string, reason: string): void {
        this.writeToFile(`SKIPPED - DNI: ${dni} | Reason: ${reason}`);
    };

    logSummary(summary: {
        total: number;
        successful: number;
        failed: number;
        skipped: number;
    }): void {
        this.writeToFile('═══════════════════════════════════════════════════');
        this.writeToFile(`Scheduled report completed`);
        this.writeToFile(`Total: ${summary.total} | Success: ${summary.successful} | Failed: ${summary.failed} | Skipped: ${summary.skipped}`);
        this.writeToFile('═══════════════════════════════════════════════════');
        this.writeToFile(''); // Empty line for readability
    }
};