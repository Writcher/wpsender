import { Injectable } from '@nestjs/common';
import { SqlServerService } from 'src/infrastructure/database/sqlserver/sqlserver.service';

export interface EmployeeRecords {
    nombre: string;
    id_empleado: string;
    fecha_acceso: string;
    primera_hora: string;
    dispositivo_entrada: string;
    ultima_hora: string;
    dispositivo_salida: string;
};

@Injectable()
export class RegistrosAccesoService {
    constructor(
        private sqlServerService: SqlServerService
    ) { };

    async getEmployeeRecords(dni: string): Promise<EmployeeRecords[]> {
        const result = await this.sqlServerService.query(
            `WITH RankedAccess AS (
                SELECT
                    nombre,
                    id_empleado,
                    fecha_acceso,
                    hora_acceso,
                    nombre_dispositivo,
                    ROW_NUMBER() OVER (PARTITION BY id_empleado, fecha_acceso ORDER BY hora_acceso ASC) AS rn_primera,
                    ROW_NUMBER() OVER (PARTITION BY id_empleado, fecha_acceso ORDER BY hora_acceso DESC) AS rn_ultima
                FROM control_de_accesos.dbo.registros_acceso
                WHERE fecha_acceso >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
                AND fecha_acceso < CAST(GETDATE() AS DATE)
                AND id_empleado = @dni
                AND numero_serie_dispositivo != 'L19848894'
            )
            SELECT
                nombre,
                id_empleado,
                CONVERT(VARCHAR(10), fecha_acceso, 23) AS fecha_acceso,
                CONVERT(VARCHAR(8), MAX(CASE WHEN rn_primera = 1 THEN hora_acceso END), 108) AS primera_hora,
                MAX(CASE WHEN rn_primera = 1 THEN nombre_dispositivo END) AS dispositivo_entrada,
                CONVERT(VARCHAR(8), MAX(CASE WHEN rn_ultima = 1 THEN hora_acceso END), 108) AS ultima_hora,
                MAX(CASE WHEN rn_ultima = 1 THEN nombre_dispositivo END) AS dispositivo_salida
            FROM RankedAccess
            WHERE rn_primera = 1 OR rn_ultima = 1
            GROUP BY nombre, id_empleado, fecha_acceso
            ORDER BY fecha_acceso ASC;`,
            { dni }
        );

        return result.recordset;
    };
};
    