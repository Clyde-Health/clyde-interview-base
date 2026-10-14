import Patient from '@clyde-api/models/patient'
import { AppError } from '@clyde-api/types/errors'
import type { RequestContext } from '@clyde-api/types/context'
import logger from '@clyde-api/utils/logger'
import type { CreatePatientParams, ListPatientsQuery, PatientResult } from './schemas'

const toResult = (patient: Patient): PatientResult => ({
  id: patient.id,
  first_name: patient.first_name,
  last_name: patient.last_name,
  date_of_birth: patient.date_of_birth,
  phone_number: patient.phone_number,
  created_at: new Date(patient.created_at).toISOString(),
  updated_at: new Date(patient.updated_at).toISOString(),
})

/**
 * Pure business logic for patients. No Express `req`/`res` and no HTTP status numbers: failures are
 * thrown as `AppError`s and the global error handler turns `code` into a status.
 */
export class PatientController {
  async list(query: ListPatientsQuery, ctx: RequestContext): Promise<PatientResult[]> {
    const patients = await Patient.query().orderBy('created_at', 'desc').limit(query.limit)

    logger.info('[PatientController] listed patients', { requestId: ctx.requestId, count: patients.length })
    return patients.map(toResult)
  }

  async get(id: string, ctx: RequestContext): Promise<PatientResult> {
    const patient = await Patient.query().findById(id)

    if (!patient) {
      throw AppError.notFound('Patient not found', { requestId: ctx.requestId, patientId: id })
    }

    return toResult(patient)
  }

  async create(params: CreatePatientParams, ctx: RequestContext): Promise<PatientResult> {
    const patient = await Patient.query().insertAndFetch(params)

    // `first_name` etc. are in PHI_FIELDS, so even if someone logged `params` here they would print
    // as [PHI]. Log ids, not people.
    logger.info('[PatientController] created patient', { requestId: ctx.requestId, patientId: patient.id })
    return toResult(patient)
  }
}

export const patientController = new PatientController()
