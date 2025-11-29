Create a new folder on your machine. Open the folder in vscode. Then write the following:
  - git init
  - git clone https://github.khoury.northeastern.edu/mmirza/real-mask-app.git

Install docker and docker desktop to be able to run the project

Add a .env file in the frontend folder with the following variables:

To run the project make sure you are at the root of the project that has the file docker-compose.yml.
  - docker-compose up --build (builds the containers from scratch and runs project)
  - docker-compose up (builds containers and launches project)
  - docker-compose down (stops and unmounts containers)
  ** note that any changes to backend will require docker-compose down and then docker-compose up --build **
  ** this does not apply to changes to front end a simple docker-compose down and up will do **

You should see docker logs in the terminal then at the end you will see Local: http://localhost:5173/
You can either click on the link in the terminal or paste the link into a browser to see the frontend

When you are done and you want to shut off the containers press ctrl + x. This will shut down the docker containers

Inside forntend/src you will see the supabase entry, it uses the .env variables to make a supabase API connection, import supabase from the entry file to be able to use the supabase API in the frontend

Each person has their own branch, simply git checkout <your-name> (in lowercase) to go to your branch. MAKE SURE ALL CODE CHANGES ARE DONE IN YOUR OWN BRANCH TO AVOID ISSUES!!!

To make commits:
  - git add .
  - git commit -m "" (add a message inside "")
  - git push
  - go to github browser and merge your changes

To pull changes into local main (try to keep your main always updated with the remote main, this avoid issues):
  - git checkout main
  - git pull origin main

To pull changes into your local branch (this will delete your work, make sure to always push before stopping work):
  - git fetch origin
  - git rebase origin/main

Gmail Account Credentials:
email: real.mask.NU@gmail.com 
password: RealMaskNU$2025

