# CoogMusic

A full-stack music streaming application built with React and a Node.js backend.

## Tech Stack

- **Client:** React, TypeScript, Vite
- **Server:** Node.js, Express, TypeScript, PostgreSQL
- **Authentication:** JWTs stored in cookies
- **Deployment:** Configured for Azure

## Features

- User authentication (signup, login, logout)
- Browse and play songs, albums, and artist pages
- Create and manage playlists
- Like songs and follow artists
- Persistent audio queue
- Dynamic theming

## Getting Started

To run this project locally, you'll need to set up both the client and server.

**1. Installation**

There's a root `package.json` to handle installation for both client and server.

```bash
npm install
```

**2. Environment Variables**

You will need to create `.env` files for both the `client` and `server`.

- **Server:** Create a `.env` file in the `server/` directory. It will need variables for the database connection, JWT secret, and blob storage. Refer to the database and JWT config files for required variables.

- **Client:** Create a `.env.development` file in the `client/` directory.

```
VITE_API_URL=http://localhost:8080/api
```

**3. Running the App**

You can run both client and server concurrently from the root directory.

```bash
npm run dev
```

This will start the Vite dev server for the client (usually on `localhost:5173`) and the Node.js server for the backend (on `localhost:8080`).

## Architecture

The project follows a client-server architecture with a React frontend communicating with a Node.js backend via a RESTful API.

### Client (`client/`)

The client is a single-page application built with React and Vite. It handles all user interface rendering and client-side state.

### Server (`server/`)

The backend is a layered Express application that serves the API and handles all business logic. The structure is designed to separate concerns:

- **Routes:** Define the API endpoints and direct requests to the appropriate controllers/services.
- **Middleware:** Handles authentication, error handling, and request parsing.
- **Services:** Contain the core business logic. They orchestrate data flow between the routes and the data access layer.
- **Repositories:** The data access layer. Each repository corresponds to a database table and encapsulates all the SQL queries and logic for that entity.

### Database & Repositories

The backend uses a **PostgreSQL** database.

Interaction with the database is handled through a **repository pattern**. Each major entity (e.g., `User`, `Song`, `Playlist`) has its own repository class in the `server/src/repos/` directory.
