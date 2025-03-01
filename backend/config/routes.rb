Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
  end

  post "/graphql", to: "graphql#execute"

  # API routes
  namespace :api do
    # Auth routes
    post '/register', to: 'auth#register'
    post '/login', to: 'auth#login'
    delete '/logout', to: 'auth#logout'

    namespace :v1 do
      resources :reservations
      get 'reservations/by_date/:date', to: 'reservations#index'
      get 'user', to: 'users#show'
    end
  end

  # Set the root path to the GraphiQL interface in development, or the GraphQL endpoint in production
  root to: proc { |env|
    if Rails.env.development?
      [302, { 'Location' => '/graphiql' }, ['Redirecting...']]
    else
      [200, { 'Content-Type' => 'text/html' }, ['API Server Running']]
    end
  }
end

