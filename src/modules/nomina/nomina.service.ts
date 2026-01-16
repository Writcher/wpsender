import { Injectable } from '@nestjs/common';
import { SqlServerService } from 'src/infrastructure/database/sqlserver/sqlserver.service';

export interface EmployeeInfo {
    nombre: string;
    apellido: string;
    telefono: string;
    dni: string;
};

@Injectable()
export class NominaService {
    constructor(
        private sqlServerService: SqlServerService
    ) { };

    async getEmployeeInfo(dni: string): Promise<EmployeeInfo> {
        const result = await this.sqlServerService.query(
            'SELECT [nombre], [apellido], [telefono] FROM [control_de_accesos].[dbo].[nomina] WHERE [dni] = @dni',
            { dni }
        );
        return result.recordset[0];
    };

    async getUocraEmployeesInfo(): Promise<EmployeeInfo[]> {
        const result = await this.sqlServerService.query(`
            SELECT [nombre], [apellido], [telefono], [dni]
            FROM [control_de_accesos].[dbo].[nomina] 
            WHERE (ingreso IS NULL OR GETDATE() >= ingreso)
                AND (egreso IS NULL OR GETDATE() <= egreso)
                AND [CONVENIO] LIKE '%UOCRA%'
                AND [telefono] IS NOT NULL
        `);
        return result.recordset;
    };
};

