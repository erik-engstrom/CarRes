class ApplicationController < ActionController::API
  private

  def render_json_response(data, status = :ok)
    render json: data, status: status
  end
end
