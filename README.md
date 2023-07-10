[![npm version](https://badge.fury.io/js/directus-migrator.svg)](https://badge.fury.io/js/directus-migrator)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

<h1 align="center">
   <b>
        <a href="https://www.npmjs.com/package/directus-migrator"><img style="width:50%;"src="https://github.com/CodingButter-LLC/directus-migrator/raw/main/images/logo.png" /></a><br>
    </b>
</h1>

# Directus Migrator

> A Command-Line tool to simply migrate Directus Schemas,Roles and Permissions between different environments within your project

## Table of contents

- [Directus Migrator](#directus-migrator)
  - [Table of contents](#table-of-contents)
  - [Warning](#warning)
  - [Getting Started](#getting-started)
  - [Initilization](#initilization)
  - [Usage](#usage)
    - [Basic](#basic)
    - [Force Migration](#force-migration)
  - [API](#api)
    - [Options](#options)
  - [Authors](#authors)
  - [License](#license)

## Warning

> As of right now directus-migrator does not migrate from sqlite to postgress

## Getting Started

These instructions will explain how to use the basic directus-migrator command and which arguments are required

## Initilization

No installation neccessary. just run the following command from within the project root

```sh
npx directus-migrator -i
```

![cli-init](https://github.com/CodingButter-LLC/directus-migrator/raw/main/images/cli-init.jpg)


### directus-migrator.config.js

example

```js
const config = {
  environments:[
    {
      "name": "development",
      "endpoint": "<development-url>",
      "accessToken": "<development_admin_token>"
    },
    {
      "name": "staging",
      "endpoint": "<staging-url>",
      "accessToken": "<staging_admin_token>"
    },
    {
      "name": "production",
      "endpoint": "<production-url>",
      "accessToken": "<production_admin_token>",
      "production":true
    },
  ]
}
export default config 
```

## Usage

### Basic

```sh
npx directus-migrator -s development -t production
```

### Force Migration

> If your environments are not on the exact same version of directus you may need to force the migration with the -force flag

```sh
npx directus-migrator -f -s development -t staging
```

## API

Supported options

### Options

> npx directus-migrator --argument [value]

when adding boolean flags make sure to use ```--fullFlagName``` or ```-alias```  (eg. --init or -i)

| Name | Type | usage | Description
| :-: | :-: | :-: | :-:
| `init`        | boolean | ```--init or -i```        | Initialize config file
| `force`       | boolean | ```--force or -f```       | Force migration between directus versions
| `roles`       | boolean | ```--roles or -r```       | Only migrates roles [ can be combined with permissions,schema,flows ]
| `permissions` | boolean | ```--permissions or -p``` | Only migrate permissions [ can be combined with roles,schema,flows ]
| `schema`      | boolean | ```--schema or -c```      | Only migrate schema [ can be combined with roles,permissions,flows ]
| `flows`       | boolean | ```--flows or -l``` | Only migrate flows [ can be combined with rols,permissions,schema]
| `help`        | boolean | ```--help or -h```        | Display help menu
| `source`      | string  | ```--source envname or -s envname``` | Environment to migrate from
| `target`      | string  | ```--target envname or -t envname``` | Environment to migrate to

## Authors

**CodingButter** - *Initial work* - [CodingButter](https://github.com/CodingButter-LLC)

See also the list of [contributors](https://github.com/CodingButter-LLC/directus-migrator/contributors) who participated in this project.

## License

[MIT License](https://andreasonny.mit-license.org/2019) © CodingButter
