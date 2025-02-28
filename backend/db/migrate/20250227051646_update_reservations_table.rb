class UpdateReservationsTable < ActiveRecord::Migration[7.1]
  def change
    # Remove old columns
    remove_column :reservations, :date
    remove_column :reservations, :start_time
    remove_column :reservations, :end_time
    remove_column :reservations, :user_name
    remove_column :reservations, :user_email

    # Add new columns
    add_reference :reservations, :user, null: false, foreign_key: true
    add_column :reservations, :date, :date, null: false
    add_column :reservations, :start_time, :string, null: false
    add_column :reservations, :end_time, :string, null: false

    # Add indexes
    add_index :reservations, :date
  end
end
