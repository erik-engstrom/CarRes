class ReservationSerializer
  include JSONAPI::Serializer
  
  attributes :date, :start_time, :end_time, :created_at, :updated_at
  
  belongs_to :user
  
  attribute :user_email do |reservation|
    reservation.user.email
  end

  attribute :user_name do |reservation|
    reservation.user.email.split('@')[0] # Using email username as name for now
  end
end 