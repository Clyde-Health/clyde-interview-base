import { PatientController } from '@clyde-api/server/controllers/patient/PatientController'
import Patient from '@clyde-api/models/patient'
import { AppError } from '@clyde-api/types/errors'

jest.mock('@clyde-api/models/patient')

const row = {
  id: '6f1c1d2e-0000-4000-8000-000000000001',
  first_name: 'Ada',
  last_name: 'Lovelace',
  date_of_birth: '1990-12-10',
  phone_number: '+15555550123',
  created_at: '2026-10-14T12:00:00.000Z',
  updated_at: '2026-10-14T12:00:00.000Z',
}

// Stand-in for Objection's chainable query builder: every method returns the builder, and awaiting
// it resolves to `result`.
const mockQuery = (result: unknown) => {
  const builder: any = {
    orderBy: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    findById: jest.fn(() => builder),
    insertAndFetch: jest.fn(() => builder),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
  ;(Patient.query as jest.Mock).mockReturnValue(builder)
  return builder
}

describe('PatientController', () => {
  const controller = new PatientController()
  const ctx = { requestId: 'test-request' }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('get', () => {
    it('returns the patient when it exists', async () => {
      const builder = mockQuery(row)

      const patient = await controller.get(row.id, ctx)

      expect(builder.findById).toHaveBeenCalledWith(row.id)
      expect(patient).toEqual(row)
    })

    it('throws not_found when the patient does not exist', async () => {
      mockQuery(undefined)

      const promise = controller.get(row.id, ctx)

      await expect(promise).rejects.toBeInstanceOf(AppError)
      await expect(promise).rejects.toMatchObject({ code: 'not_found', statusCode: 404 })
    })
  })

  describe('list', () => {
    it('returns newest first, capped at the requested limit', async () => {
      const builder = mockQuery([row])

      const patients = await controller.list({ limit: 10 }, ctx)

      expect(builder.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(builder.limit).toHaveBeenCalledWith(10)
      expect(patients).toEqual([row])
    })
  })

  describe('create', () => {
    it('inserts and returns the new patient', async () => {
      const builder = mockQuery(row)
      const params = {
        first_name: 'Ada',
        last_name: 'Lovelace',
        date_of_birth: '1990-12-10',
        phone_number: '+15555550123',
      }

      const patient = await controller.create(params, ctx)

      expect(builder.insertAndFetch).toHaveBeenCalledWith(params)
      expect(patient.id).toBe(row.id)
    })
  })
})
