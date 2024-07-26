# telegram message purger

this thing is a simple script that purges all messages from a specified telegram chat

## installation

you are required to have node.js installed and a telegram account

first of all, install all dependencies:

##### npm

```sh
npm install
```

##### yarn

```sh
yarn
```

## config (`.env`)

log in into [my.telegram.org](https://my.telegram.org/). click on [API development tools](https://my.telegram.org/apps).

open `.env`. paste your `App api_id` into `TELEGRAM_API_ID` and your `App api_hash` into `TELEGRAM_API_HASH`

## usage

##### npm

```sh
npm run dev
```

##### yarn

```sh
yarn dev
```

## faq

### script only detected 10k messages when i have more than 10k messages in the chat

this is a telegram limitation and can not be bypassed. after first deleted 10k messages just wait a bit and start the script again.
