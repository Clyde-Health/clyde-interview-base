import { Model } from 'objection'

export class Base extends Model {
  // pg returns timestamptz columns as Date objects.
  created_at!: Date
  updated_at!: Date

  $beforeUpdate() {
    this.updated_at = new Date()
  }
}
