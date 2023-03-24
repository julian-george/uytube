## Description

This is an app that allows users to create annotations to YouTube videos, and save them for others to view. This is intended to be used in a musical context, but it can possibly be used in many ways. This project's frontend was previously created here: [repo](https://github.com/ospreyelm/uytube). This repo takes that frontend code and adds cloud saving capabilities, along with other improvements.

View the app [here](https://uytube.herokuapp.com)

## File Structure

- backend - contains the backend files to serve html and save annotations
  - index.js - handles all get/post requests and serves static html
  - Music.js - contains MongoDB model for Music, or how we store the annotations
- frontend - contains the static frontend files that are served
  - index.html - the webpage and much of the scripting
  - index.js - added scripts that mostly deal with backend connection.

## Local Deployment

To fully deploy Uytube locally, the following steps is how you do it. If you need to just edit the front end, skip steps 3-5.

1. `git clone` this repo locally to download it
2. Run `npm i` on the command line within this folder to install all needed packages
3. Install mongodb and initialize a database. Good instructions [here](https://docs.mongodb.com/manual/administration/install-community/)
4. Create a .env file with the following in it:
   - PORT=3000
   - MONGODB_URI=(insert your db url here)
     - Should be mongodb://localhost:27017 if the DB is local
5. In frontend/index.js, change the backendUrl variable to include the port (the same as in the .env, which is 3000 by default)
6. Run `npm start` on the command line to initialize the app.
   - If you want the app to auto-update as you code, run `npm run-script dev`.
7. Visit localhost:3000 in your browser to view it!
