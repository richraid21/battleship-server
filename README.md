# Battleship Server

## Usage Instructions

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
yarn run knex:ml
```

Build & Run the application

```console
yarn build && node lib/server.js
``` 

### Tests

```console
yarn test
```

### Generate API Documentation

API Docs are generated with `apiDoc`

```console
yarn docs
```

Navigate to /docs and launch index.html