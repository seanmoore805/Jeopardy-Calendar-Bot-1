# Jeopardy Daily Calendar Bot

A Discord bot for playing the *Jeopardy!* Day-to-Day Calendar.

## File Structure

- `src`
  - `commands`: Discord slash commands; the primary source of interaction with the bot
  - `scripts`: Command line utilities; used for general (backend) maintenance work
  - `modules`: Backend code that is relied upon for most of the commands/scripts
  - `tests`: Unit tests for mostly targeting modules
  - `index.ts`: Primary entry point for running the bot (`npm start`)

## TODO

- Log file rotation (there's a Winston module or plugin or something like that for that)
- Graceful handling if trying to login without enough permissions on the account

## Bot setup

- Rename `.env.example` -> `.env` and add bot token from Discord developer console
- Rename `config.example.json` -> `config.json` and add bot application id from Discord developer console
    and add id(s) of test server(s) (for guild command deployment)
