# Obsidian Unix Domain Sockets REST API

**This is a fork of [obsidian-local-rest-api](https://github.com/coddingtonbear/obsidian-local-rest-api) by [Adam Coddington](https://github.com/coddingtonbear), modified to use Unix domain sockets instead of TCP loopback.**

> **Warning**: This is untested AI-generated code. Use at your own risk. Maintained by [@readwithai](https://github.com/readwithai).

## Why Unix Domain Sockets?

- More secure - no network exposure, even on localhost
- **Filesystem permissions** - control access using standard file permissions (no API key needed!)
- Files rather than ports - easier to find and manage, no port collisions

Original documentation: https://coddingtonbear.github.io/obsidian-local-rest-api/

Have you ever needed to automate interacting with your notes?  This plugin gives Obsidian a REST API you can interact with your notes from other tools so you can automate what you need to automate.

This plugin provides an HTTP interface over Unix domain sockets, secured via filesystem permissions, that allows you to:

- Read, create, update or delete existing notes.  There's even a `PATCH` HTTP method for inserting content into a particular section of a note.
- List notes stored in your vault.
- Create and fetch periodic notes.
- Execute commands and list what commands are available.

## CLI Client

A command-line client is included:

```bash
# Install globally
npm install -g .

# Or use directly
./cli.js <command>

# Commands
obsidian current              # Get currently active file
obsidian read <path>          # Read a file
obsidian search <query>       # Search vault
obsidian list [path]          # List files
obsidian status               # Server status

# Environment
export OBSIDIAN_SOCKET=~/my-vault/.obsidian/obsidian.sock  # Custom socket path (default is <vault>/.obsidian/obsidian.sock)
```

## Credits

This was inspired by [Vinzent03](https://github.com/Vinzent03)'s [advanced-uri plugin](https://github.com/Vinzent03/obsidian-advanced-uri) with hopes of expanding the automation options beyond the limitations of custom URL schemes.
