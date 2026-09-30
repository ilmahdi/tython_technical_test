#!/bin/sh
set -e

if [ "$DEV_MODE_APP" = "true" ]; then
	echo "Running the frontend in development mode..."
	exec npm run dev -- --host 0.0.0.0 --port 3000
fi

if [ "$BUILD_FRONT_APP" = "true" ]; then
	echo "Building the frontend application..."
	npm run build
fi

exec npm run preview -- --host 0.0.0.0 --port 3000