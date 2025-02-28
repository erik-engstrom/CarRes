Rails.application.routes.draw do
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
  end

  post "/graphql", to: "graphql#execute"

  # Devise routes for authentication
  # devise_for :users,
  #            controllers: {
  #              sessions: 'users/sessions',
  #              registrations: 'users/registrations'
  #            }

  # API routes
  namespace :api do
    namespace :v1 do
      resources :reservations
      get 'user', to: 'users#show'
    end
  end
end 