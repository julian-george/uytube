## Description
This is an app that allows users to create annotations to YouTube videos, and save them for others to view. This is intended to be used in a musical context, but it can possibly be used in many ways. The frontend of this was completed before me, in this [repo](https://github.com/ospreyelm/uytube), so I hooked it up to a nodejs backend and a MongoDB database to allow storing and sharing annotations remotely.

View the app [here](https://uytube.herokuapp.com)

## File Structure
* backend - contains the backend files to serve html and save annotations
    * index.js - handles all get/post requests and serves static html
    * Music.js - contains MongoDB model for Music, or how we store the annotations
* frontend - contains the static frontend files that are served
    * index.html - the webpage and much of the scripting
    * index.js - the additional scripting I (Julian George) added to connect to backend

## Local Deployment
To fully deploy Uytube locally, the followin steps is how you do it. If you need to just 
1. `git clone` this repo locally to download it
2. Run `npm i` on the command line within this folder to install all needed packages
3. Install mongodb and initialize a database. Good instructions [here](https://docs.mongodb.com/manual/administration/install-community/)
4. Create a .env file with the following in it:
    * PORT=3000
    * MONGOURL=(insert your db url here)
        * Contact me if you need the url to the app's main database for any reason, since that's what's here in production
5. In frontend/index.js, change the backendUrl variable to include the port (the same as in the .env, which is 3000 by default)
6. Run `npm start` or `npm run-script start` on the command line to initialize the app.
7. Visit localhost:3000 in your browser to view it!
8. If you have permissions, `git push` at the end to push changes to the main app.
