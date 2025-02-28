class AuthenticationService
  class << self
    def encode_token(payload)
      JWT.encode(payload, jwt_secret)
    end

    def decode_token(token)
      JWT.decode(token, jwt_secret)[0]
    rescue JWT::DecodeError
      nil
    end

    private

    def jwt_secret
      Rails.application.credentials.secret_key_base
    end
  end
end 