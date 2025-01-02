# Jeopardy Daily Calendar Bot

A Discord bot for playing the *Jeopardy!* Day-to-Day Calendar.

## File Structure

- `src`
  - `commands`: Discord slash commands; the primary source of interaction with the bot
  - `scripts`: Command line utilities; used for general (backend) maintenance work
  - `modules`: Backend code that is relied upon for most of the commands/scripts
  - `tests`: Unit tests for mostly targeting modules
  - `index.ts`: Primary entry point for running the bot (`npm start`)
