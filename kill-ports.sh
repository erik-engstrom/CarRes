#!/bin/bash

# List of ports to check and free
PORTS=(3000 3001 3002 3003 5173 5174 5175 8000 8080)

echo "Checking for processes using common development ports..."

for PORT in "${PORTS[@]}"; do
  # Find process using this port
  PID=$(lsof -ti:$PORT)
  
  if [ ! -z "$PID" ]; then
    echo "Found process $PID using port $PORT"
    
    # Get command name of the process
    COMMAND=$(ps -p $PID -o comm=)
    
    echo "Process is: $COMMAND"
    echo "Killing process $PID on port $PORT..."
    
    # Kill the process
    kill -9 $PID
    
    echo "Process on port $PORT has been terminated."
  else
    echo "No process found using port $PORT"
  fi
done

echo "Done checking ports. All specified ports should now be free." 