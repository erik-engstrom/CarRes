module Types
  class MutationType < Types::BaseObject
    field :create_reservation, mutation: Mutations::CreateReservation
    field :update_reservation, mutation: Mutations::UpdateReservation
  end
end 