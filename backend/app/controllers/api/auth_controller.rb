module Api
  class AuthController < ApplicationController
    def register
      user = User.new(user_params)
      
      if user.save
        token = JsonWebToken.encode(user_id: user.id)
        render json: {
          token: token,
          email: user.email,
          message: 'User registered successfully'
        }, status: :created
      else
        render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def login
      Rails.logger.debug "Login attempt with params: #{params.inspect}"
      user = User.find_by(email: params[:email])
      Rails.logger.debug "Found user: #{user.inspect}"
      
      if user&.authenticate(params[:password])
        token = JsonWebToken.encode(user_id: user.id)
        response.headers['Authorization'] = "Bearer #{token}"
        render json: {
          token: token,
          email: user.email,
          message: 'Logged in successfully'
        }
      else
        Rails.logger.debug "Authentication failed for user: #{user&.email}"
        render json: { error: 'Invalid email or password' }, status: :unauthorized
      end
    end

    private

    def user_params
      params.permit(:email, :password, :password_confirmation)
    end
  end
end 