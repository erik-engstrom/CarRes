class Reservation < ApplicationRecord
  belongs_to :user

  validates :date, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  
  validate :end_time_after_start_time
  validate :no_overlapping_reservations
  
  private
  
  def end_time_after_start_time
    return if start_time.blank? || end_time.blank?
    
    if start_time >= end_time
      errors.add(:end_time, "must be after start time")
    end
  end
  
  def no_overlapping_reservations
    return if date.blank? || start_time.blank? || end_time.blank?
    
    overlapping_reservations = Reservation.where(date: date)
                                      .where.not(id: id)
                                      .select do |reservation|
      (start_time >= reservation.start_time && start_time < reservation.end_time) ||
      (end_time > reservation.start_time && end_time <= reservation.end_time) ||
      (start_time <= reservation.start_time && end_time >= reservation.end_time)
    end
    
    if overlapping_reservations.any?
      errors.add(:base, "Reservation overlaps with existing reservation")
    end
  end
end 