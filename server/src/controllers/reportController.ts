import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import * as dbUtil from './../utils/dbUtil';

interface Report {
    year: number,
    caregivers: {
        name: string,
        patients: string[]
    }[]
}

export const getReport = async (req: Request, res: Response) => {
    let year = parseInt(req.params.year);

    const sql = `
        SELECT
            caregiver.id      AS caregiver_id,
            caregiver.name    AS caregiver_name,
            patient.id        AS patient_id,
            patient.name      AS patient_name,
            visit.date        AS visit_date
        FROM caregiver
        JOIN visit ON visit.caregiver = caregiver.id
        JOIN patient ON patient.id = visit.patient
        WHERE date_part('year', visit.date) = ${year}    
    `;

    let result: QueryResult;
    try {
        result = await dbUtil.sqlToDB(sql, []);
        const report: Report = {
            year: year,
            caregivers: []
        };

        report.caregivers = Object.entries<string[]>(result.rows.reduce((a, { caregiver_name, patient_name }) =>
            (a[caregiver_name] = (a[caregiver_name] || []).concat(patient_name), a), {}))
            .map(([name, patients]) => ({ name, patients }));
        
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ error: error })
    }

}
