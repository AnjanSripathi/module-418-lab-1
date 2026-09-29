# User Authentication API

A small REST API built with Node.js, Express, MongoDB, and Mongoose. It demonstrates user registration, password hashing with bcrypt, login password verification, and JSON Web Token (JWT) creation and verification.

## Project overview

The application provides two authentication endpoints:

- Register a user with a username, email, and password.
- Log in with an email and password, then receive a signed JWT.

Passwords are hashed before they are saved to MongoDB. The login route compares the submitted password with the stored hash using the `isCorrectPassword` model method. JWTs currently contain the user’s MongoDB `_id` and `username` and expire after one hour.

## Project files

```text
lab-1/
├── .env                     # Local configuration and secrets (do not commit)
├── .gitignore
├── package.json
├── server.js                # Express app, database connection, and auth routes
├── User.js                  # Mongoose user schema and password methods
├── verifyAuthentication.js  # Reusable Bearer-token verification middleware
└── README.md
```

## Requirements

- Node.js and npm
- A MongoDB database, either local or MongoDB Atlas
- Postman, Insomnia, or another HTTP client for testing

## Installation and configuration

Install dependencies from this project directory:

```sh
npm install
```

Create a `.env` file in the project root. Do not put real credentials in this README or commit the `.env` file.

```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/module418_auth
JWT_SECRET=replace_this_with_a_long_random_secret
```

Use your actual MongoDB connection URI for `MONGO_URI`. `PORT` is optional; the server defaults to port `3001`. `JWT_SECRET` must be set to a private, sufficiently random value for signing and verifying tokens.

Start the development server with nodemon:

```sh
npm run dev
```

Or start it with Node directly:

```sh
npm start
```

The server prints its listening URL. If `PORT` is unset, it listens at `http://localhost:3001`.

## User model

The Mongoose schema in `User.js` defines:

| Field | Type | Rules |
| --- | --- | --- |
| `username` | String | Required, unique, trimmed |
| `email` | String | Required, unique, checked against a basic email pattern |
| `password` | String | Required, minimum 8 characters |
| `createdAt` / `updatedAt` | Date | Automatically added by Mongoose timestamps |

The `pre('save')` hook hashes a new or modified password with bcrypt using 10 salt rounds. The `isCorrectPassword(password)` instance method calls `bcrypt.compare()` and resolves to `true` or `false`.

## API endpoints

All request bodies should be sent as JSON. The server enables `express.json()` middleware, so in Postman choose **Body → raw → JSON**. Do not send registration or login fields as URL query parameters or as custom headers.

### Register

```http
POST http://localhost:3001/api/users/register
Content-Type: application/json
```

Example body:

```json
{
	"username": "anjan",
	"email": "anjan@example.com",
	"password": "securepass123"
}
```

On success, the current implementation responds with status `201` and a JSON object containing a success message and a JWT. The token payload contains `_id` and `username` and expires in one hour. The user is saved in MongoDB with a hashed password.

If the email already exists, the route responds with status `400`. The schema also requires usernames and emails to be unique, so a duplicate username can fail during database validation as well.

### Log in

```http
POST http://localhost:3001/api/users/login
Content-Type: application/json
```

Example body:

```json
{
	"email": "anjan@example.com",
	"password": "securepass123"
}
```

On success, the current implementation responds with status `200`, a success message, and a one-hour JWT containing `_id` and `username`. If the email is not found or the password does not match, it returns the same generic `400` response so it does not disclose which credential was incorrect.

## Using the JWT middleware

`verifyAuthentication.js` exports middleware that expects a request header in this format:

```http
Authorization: Bearer <token>
```

It verifies the token with `JWT_SECRET`, stores the decoded claims on `req.user`, then calls `next()`. Missing, malformed, expired, or invalid tokens receive a `401` response.

The middleware is currently defined but is **not mounted on any route** in `server.js`, so the current API has no protected endpoint. To protect a future route, import the middleware and register it on that route.

## Issues encountered and resolutions

### 1. POST requests returning 404

The application defines `POST /api/users/register` and `POST /api/users/login`; a browser address bar sends a `GET` request, not a `POST`. Use Postman or another HTTP client, select the POST method, and use the exact path and port printed by the server. The default port is `3001` unless `.env` sets `PORT`.

### 2. Sending credentials in headers or URL parameters

The routes read credentials from `req.body`, not from request headers or `req.query`. Send username, email, and password in a JSON body. `Content-Type: application/json` describes that body’s format; it does not carry the credentials itself. Avoid putting passwords in URLs because URLs can be retained in browser history, logs, and monitoring systems.

### 3. JSON body not being available

Express does not parse JSON bodies by default. `app.use(express.json())` is registered before the authentication routes in `server.js`, allowing the handlers to read values from `req.body`.

### 4. Password hashing and comparison

The password hook uses an asynchronous function and returns its promise to Mongoose; it should not also accept a `next` callback unless it calls that callback. The current hook omits the callback and awaits bcrypt hashing. `isCorrectPassword()` compares the submitted plain-text password with the stored bcrypt hash; passwords should never be manually hashed before sending them to the registration endpoint.

### 5. JWT payload changes do not update existing tokens

JWTs are signed snapshots. Updating the code to include `username` in the payload affects tokens created afterward; it cannot change tokens that were already issued. Users do not need to register again—logging in again produces a fresh token with the current `_id` and `username` claims. Existing tokens remain unchanged until expiration.

## Current limitations and follow-up improvements

- The assignment asks registration and login responses to include the user object without the password. The current routes return a message and token, but do **not** return a user object. Add a password-safe response object if that rubric requirement applies.
- `verifyAuthentication.js` is not yet used by a protected route.
- `server.js` starts listening without waiting for `mongoose.connect()` to finish. For more reliable startup, await the database connection before calling `app.listen()` and report connection failures clearly.
- The password schema currently has `trim: true`. Consider removing it so leading/trailing spaces in passwords are preserved exactly as entered; password values are generally not normalized.
- `.gitignore` currently lists `verifyAuthentication.js`, so Git will ignore that middleware file. Remove that entry if the middleware should be included in the repository.
- The `test` script in `package.json` is a placeholder and does not run an automated test suite yet.


