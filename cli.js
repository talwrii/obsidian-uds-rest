#!/usr/bin/env node
/**
 * CLI client for obsidian-uds-rest
 * Talks to Obsidian via Unix domain socket
 */

const http = require('http');
const fs = require('fs');

const SOCKET_PATH = process.env.OBSIDIAN_SOCKET || '/tmp/obsidian.sock';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      socketPath: SOCKET_PATH,
      path: path,
      method: method,
      headers: {},
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function getCurrentFile() {
  const response = await request('GET', '/active/');
  return response;
}

async function readFile(path) {
  const encodedPath = encodeURIComponent(path);
  const response = await request('GET', `/vault/${encodedPath}`);
  return response;
}

async function searchVault(query) {
  const response = await request('POST', '/search/', { query });
  return response;
}

async function listVault(path = '') {
  const encodedPath = path ? encodeURIComponent(path) : '';
  const response = await request('GET', `/vault/${encodedPath}`);
  return response;
}

async function status() {
  const response = await request('GET', '/');
  return response;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`Usage: obsidian <command> [args]

Commands:
  current              Get currently active file
  read <path>          Read a file from the vault
  search <query>       Search the vault
  list [path]          List files in vault (or directory)
  status               Show server status

Environment:
  OBSIDIAN_SOCKET      Socket path (default: ${SOCKET_PATH})
`);
    process.exit(0);
  }

  const command = args[0];

  try {
    let result;

    switch (command) {
      case 'current':
        result = await getCurrentFile();
        if (typeof result === 'string') {
          console.log(result);
        } else {
          console.log(JSON.stringify(result, null, 2));
        }
        break;

      case 'read':
        if (args.length < 2) {
          console.error('Error: read requires a path argument');
          process.exit(1);
        }
        result = await readFile(args[1]);
        if (typeof result === 'string') {
          console.log(result);
        } else {
          console.log(JSON.stringify(result, null, 2));
        }
        break;

      case 'search':
        if (args.length < 2) {
          console.error('Error: search requires a query argument');
          process.exit(1);
        }
        result = await searchVault(args.slice(1).join(' '));
        console.log(JSON.stringify(result, null, 2));
        break;

      case 'list':
        result = await listVault(args[1] || '');
        console.log(JSON.stringify(result, null, 2));
        break;

      case 'status':
        result = await status();
        console.log(JSON.stringify(result, null, 2));
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Cannot connect to Obsidian socket at ${SOCKET_PATH}`);
      console.error('Is Obsidian running with the UDS REST API plugin enabled?');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

main();
