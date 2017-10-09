# Battleship Server

## Instructions

### Basic

To start the database and application as a single stack:

```console
docker-compose up [-d]
```

### Development
Spin up the database

```console
docker-compose up -d bs-postgres
```

Run the schema migrations

```console
yarn run knex migrate:latest
```

Build & Run the application

```console
yarn build && node lib/main.js
```