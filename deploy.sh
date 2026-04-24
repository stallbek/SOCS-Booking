#!/bin/bash

SERVER="winter2026-comp307"
REMOTE_APP="/home/cs307-user/app"

echo "Building frontend"
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed. Aborting deployment."
  exit 1
fi

echo ""
echo "Uploading to server"
scp -r backend dist package.json "$SERVER:$REMOTE_APP/"

if [ $? -ne 0 ]; then
  echo "Upload failed. Aborting deployment."
  exit 1
fi

echo ""
echo "Restarting server"
ssh "$SERVER" "cd $REMOTE_APP/backend && pkill -f 'node server.js' 2>/dev/null; sleep 1 && nohup node server.js > ~/server.log 2>&1 &"

echo ""
echo "Deployment complete"
echo "Live at: https://winter2026-comp307-group30.cs.mcgill.ca/"
echo "Check logs: ssh $SERVER 'cat ~/server.log'"
