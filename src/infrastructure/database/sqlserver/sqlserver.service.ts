import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

@Injectable()
export class SqlServerService implements OnModuleInit {
    private pool: sql.ConnectionPool | null = null;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        await this.connect();
    };

    private async connect(): Promise<sql.ConnectionPool> {
        if (this.pool) return this.pool;

        const config: sql.config = {
            user: this.configService.get<string>('SQLSERVER_USER')!,
            password: this.configService.get<string>('SQLSERVER_PASSWORD')!,
            server: this.configService.get<string>('SQLSERVER_SERVER')!,
            port: parseInt(this.configService.get<string>('SQLSERVER_PORT') || '1433'),
            database: this.configService.get<string>('SQLSERVER_DATABASE')!,
            options: {
                encrypt: this.configService.get<string>('SQLSERVER_ENCRYPT') === 'true',
                trustServerCertificate: this.configService.get<string>('SQLSERVER_TRUST_CERT') === 'true',
            },
        };

        try {
            this.pool = await sql.connect(config);
            return this.pool;
        } catch (error) {
            console.error('SQL Server connection failed:', error);
            throw error;
        };
    };

    async getPool(): Promise<sql.ConnectionPool> {
        if (!this.pool) {
            return await this.connect();
        };
        return this.pool;
    };

    async query<T = any>(queryString: string, params?: any): Promise<sql.IResult<T>> {
        const pool = await this.getPool();
        const request = pool.request();

        if (params) {
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });
        };

        return await request.query(queryString);
    };
};