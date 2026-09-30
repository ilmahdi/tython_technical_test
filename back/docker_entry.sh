#!/bin/sh
if [ "$DEV_MODE_APP" = "true" ]; then
  echo "Running in development mode..."
  npm run dev  
else
  echo "Starting the application in production mode..."
  
  if [ "$BUILD_BACK_APP" = "true" ]; then
    echo "Building the backend application..."
    npm install
    npm run build
  fi

  npm run start
fi
