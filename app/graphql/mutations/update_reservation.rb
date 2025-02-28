module Mutations
  class UpdateReservation < BaseMutation
    # Arguments
    argument :id, ID, required: true
    argument :date, GraphQL::Types::ISO8601Date, required: false
    argument :start_time, String, required: false
    argument :end_time, String, required: false

    # Fields (Return values)
    field :reservation, Types::ReservationType, null: true
    field :errors, [String], null: false

    def resolve(id:, **attributes)
      # Check if user is authenticated
      unless context[:current_user]
        return { reservation: nil, errors: ['Must be logged in to update a reservation'] }
      end

      reservation = context[:current_user].reservations.find_by(id: id)

      unless reservation
        return { reservation: nil, errors: ['Reservation not found or not authorized'] }
      end

      if reservation.update(attributes.compact)
        { reservation: reservation, errors: [] }
      else
        { reservation: nil, errors: reservation.errors.full_messages }
      end
    end
  end
end 