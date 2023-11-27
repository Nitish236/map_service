# map_service

Note : Due to security reasons I cannot provide the .example.env file so I have declared all the Variables below that are used in that.

This was a part of my Internship.

## Installation steps

1. cd to the project directory

2. Install necessary package

```sh
npm i
```

3. Create a .env file and copy the all the content from .example.env file to .env file.

```sh
DB_URI = "" # MongoDB connection URL

JWT_SECRET = "" # Secret to verify the token

# Frontend URL that can access this server(add as necessary)
F_URL="http://localhost:3000"

# Generate an API on the Goggle Maps Platform for the Web only
TESTING_API_KEY = ""

PORT = 5000

NODE_VERSION = 18.18.0
```

4. then either use
   a. npm run dev - If want to run using nodemon
   b. npm run start - If you want to use node

5. The server will be running on

```text
localhost:5000
```
