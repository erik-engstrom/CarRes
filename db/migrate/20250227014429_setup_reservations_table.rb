class SetupReservationsTable < ActiveRecord::Migration[7.1]
  def change
    create_table :reservations do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.string :start_time, null: false
      t.string :end_time, null: false

      t.timestamps
    end

    add_index :reservations, [:date, :start_time, :end_time]
  end
end 