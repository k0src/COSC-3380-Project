## Project setup

#### Files

- root:

  - `package.json`
  - scripts:
    - `npm run dev` - runs both client and server with `concurrently`
    - `npm run client` - runs client
    - `npm run server` - runs server
    - `npm run build` - builds client and server
    - `npm run install-all` - installs all dependencies for root, client, and server
    - `npm run clean` - removes `dist` and `node_modules` folders
  - `.env` - environment variables for client and server

- `server`:
  - `config/database.ts` - mysql database config
  - `middleware` - server middleware
  - `reposiories` - classes for different database tables, makes queries
    - `index.ts` - barrel export for all repositories. when you add a repository, add it here. you can import repositories using `import { repo } from "@repositories` anywhere in the server
  - `routes` - express routes
    - `index.ts` - barrel export for all routes. when you add a route, add it here. you can import routes using `import { route } from "@routes` anywhere in the server
  - `types` - typescript types for the server
    - `index.ts` - barrel export for all types. when you add a type, add it here. you can import types using `import { type } from "@types` anywhere in the server
      - for these barrel exports, make sure you export with `.js` not `.ts` or it will throw errors when you build
  - `server.ts` - main server file

#### Database

Go to https://portal.azure.com and log in with CougarNet email.

#### Files
