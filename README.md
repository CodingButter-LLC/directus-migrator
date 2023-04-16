
# Directus Migrator

Directus Migrator is a utility for easily migrating directus schemas,roles and permissions from one environment to another (eg. development->staging)

## Installation

```npm i directus-migrator```

```yarn add directus-migrator```

```pnpm i directus-migrator```

## Initializing Config

```npx directus-migrator -init```

![directus-migrator -init](https://github.com/CodingButter-LLC/directus-migrator/raw/main/images/cli-init.jpg)

### directus-migrator.config.mjs

Example

```js
const config = [
  {
    "name": "development",
    "endpoint": "<development-url>",
    "accessToken": "<development_admin_token>"
  },
  {
    "name": "staging",
    "endpoint": "<staging-url>",
    "accessToken": "<staging_admin_token>"
  }
]
export default config 
```

### CLI

```npx directus-migrator -source=development -target=staging```
