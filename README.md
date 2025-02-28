# CarRes - Car Reservation System

A full-stack car reservation application with a React frontend and Rails API backend.

## Project Structure

This project consists of two parts:

1. **Frontend**: React application with TypeScript and Tailwind CSS
2. **Backend**: Rails API application with PostgreSQL database

## Frontend Setup

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

The frontend will be available at: http://localhost:4000 (or another port if 4000 is in use)

## Backend Setup

1. Navigate to the backend directory:
```
cd backend
```

2. Install Ruby dependencies:
```
bundle install
```

3. Create and setup the database:
```
rails db:create
rails db:migrate
rails db:seed
```

4. Start the Rails server:
```
rails server -p 3000
```

The API will be available at: http://localhost:3000

## Development

For local development, you need to run both the frontend and backend servers:

1. Start the Rails server in one terminal:
```
cd backend
rails server -p 3000
```

2. Start the React development server in another terminal:
```
npm start
```

The React app is configured to proxy API requests to the Rails server, so both need to be running for the application to work properly.

## Features

- Interactive calendar for selecting reservation dates
- Time slot selection for car reservations
- Dashboard to view and manage existing reservations
- RESTful API for reservation management
- Validation to prevent overlapping reservations

## Technologies Used

### Frontend
- React
- TypeScript
- Tailwind CSS
- React Router
- Axios
- date-fns

### Backend
- Ruby on Rails (API mode)
- PostgreSQL
- Active Record
- Rack CORS 