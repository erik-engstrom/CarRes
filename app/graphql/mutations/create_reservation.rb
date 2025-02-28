module Mutations
  class CreateReservation < BaseMutation
    # Arguments
    argument :date, GraphQL::Types::ISO8601Date, required: true
    argument :start_time, String, required: true
    argument :end_time, String, required: true

    # Fields (Return values)
    field :reservation, Types::ReservationType, null: true
    field :errors, [String], null: false

    def resolve(date:, start_time:, end_time:)
      # Check if user is authenticated
      unless context[:current_user]
        return { reservation: nil, errors: ['Must be logged in to create a reservation'] }
      end

      reservation = context[:current_user].reservations.build(
        date: date,
        start_time: start_time,
        end_time: end_time
      )

      if reservation.save
        { reservation: reservation, errors: [] }
      else
        { reservation: nil, errors: reservation.errors.full_messages }
      end
    end
  end
end 