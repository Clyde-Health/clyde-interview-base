import { Base as Model } from '@clyde-api/utils/baseModel'

export default class Patient extends Model {
  id!: string
  first_name!: string
  last_name!: string
  date_of_birth!: string
  phone_number!: string | null

  static get tableName() {
    return 'patients'
  }
}
