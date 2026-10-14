/**
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable('patients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('first_name').notNullable()
    table.string('last_name').notNullable()
    table.date('date_of_birth').notNullable()
    table.string('phone_number')
    table.timestamps(true, true)
  })
}

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async (knex) => {
  await knex.schema.dropTable('patients')
}
