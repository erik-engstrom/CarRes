module Api
  class ReservationsController < ApplicationController
    before_action :set_reservation, only: [:show, :update, :destroy]

    # GET /api/reservations
    def index
      # Optional date filter
      if params[:date].present?
        @reservations = Reservation.where(date: params[:date])
      else
        @reservations = Reservation.all.order(date: :asc)
      end

      render json: @reservations
    end

    # GET /api/reservations/1
    def show
      render json: @reservation
    end

    # POST /api/reservations
    def create
      @reservation = Reservation.new(reservation_params)

      if @reservation.save
        render json: @reservation, status: :created
      else
        render json: { errors: @reservation.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # PATCH/PUT /api/reservations/1
    def update
      if @reservation.update(reservation_params)
        render json: @reservation
      else
        render json: { errors: @reservation.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/reservations/1
    def destroy
      @reservation.destroy
      head :no_content
    end

    private
      # Use callbacks to share common setup or constraints between actions
      def set_reservation
        @reservation = Reservation.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Reservation not found' }, status: :not_found
      end

      # Only allow a list of trusted parameters through
      def reservation_params
        params.require(:reservation).permit(:date, :start_time, :end_time, :user_name, :user_email)
      end
  end
end 