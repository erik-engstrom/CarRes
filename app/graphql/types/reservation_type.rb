module Types
  class ReservationType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :start_time, String, null: false
    field :end_time, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end 