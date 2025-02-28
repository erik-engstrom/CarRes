class CreateReservations < ActiveRecord::Migration[7.0]
  def change
    create_table :reservations do |t|
      t.date :date, null: false
      t.string :start_time, null: false
      t.string :end_time, null: false
      t.string :user_name
      t.string :user_email

      t.timestamps
    end
    
    add_index :reservations, :date
  end
end 