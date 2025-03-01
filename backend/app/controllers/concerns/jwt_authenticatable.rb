module JwtAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user
  end

  private

  def authenticate_user
    header = request.headers['Authorization']
    token = header.split(' ').last if header
    
    if token
      begin
        @decoded = AuthenticationService.decode_token(token)
        if @decoded
          @current_user = User.find(@decoded['user_id'])
        else
          render json: { errors: ['Invalid token'] }, status: :unauthorized
          return
        end
      rescue JWT::DecodeError
        render json: { errors: ['Invalid token'] }, status: :unauthorized
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ['User not found'] }, status: :unauthorized
      end
    else
      render json: { errors: ['Missing token'] }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end
end 