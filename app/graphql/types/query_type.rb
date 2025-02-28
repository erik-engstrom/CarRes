module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID" do
      argument :id, ID, required: true, description: "ID of the object"
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [Types::NodeType, null: true], null: true, description: "Fetches a list of objects given a list of IDs" do
      argument :ids, [ID], required: true, description: "IDs of the objects"
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # Add User-related queries
    field :users, [Types::UserType], null: false, description: "Returns a list of users"
    field :user, Types::UserType, null: true do
      argument :id, ID, required: true
    end

    # Add Reservation-related queries
    field :reservations, [Types::ReservationType], null: false, description: "Returns a list of reservations"
    field :reservation, Types::ReservationType, null: true do
      argument :id, ID, required: true
    end
    field :reservations_by_date, [Types::ReservationType], null: false do
      argument :date, GraphQL::Types::ISO8601Date, required: true
    end

    def users
      User.all
    end

    def user(id:)
      User.find(id)
    end

    def reservations
      Reservation.all
    end

    def reservation(id:)
      Reservation.find(id)
    end

    def reservations_by_date(date:)
      Reservation.where(date: date)
    end
  end
end 