module Api
  module V1
    class ReservationsController < ApplicationController
      include JwtAuthenticatable
      skip_before_action :authenticate_user, only: [:index]

      def index
        if params[:date].present?
          # Filter reservations by date
          reservations = Reservation.where(date: params[:date])
          Rails.logger.info("Filtered reservations for date #{params[:date]}: #{reservations.count} found")
        else
          # Return all reservations if no date filter
          reservations = Reservation.all
        end
        
        render json: ReservationSerializer.new(reservations).serializable_hash
      end

      def create
        reservation = current_user.reservations.build(reservation_params)
        
        if reservation.save
          render json: ReservationSerializer.new(reservation).serializable_hash,
                 status: :created
        else
          render json: { errors: reservation.errors.full_messages },
                 status: :unprocessable_entity
        end
      end

      def show
        reservation = current_user.reservations.find(params[:id])
        render json: ReservationSerializer.new(reservation).serializable_hash
      end

      def update
        reservation = current_user.reservations.find(params[:id])
        
        if reservation.update(reservation_params)
          render json: ReservationSerializer.new(reservation).serializable_hash
        else
          render json: { errors: reservation.errors.full_messages },
                 status: :unprocessable_entity
        end
      end

      def destroy
        reservation = current_user.reservations.find(params[:id])
        reservation.destroy
        head :no_content
      end

      private

      def reservation_params
        params.require(:reservation).permit(:date, :start_time, :end_time)
      end
    end
  end
end 