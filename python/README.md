# obsidian-remote
A remote control for Obsidian if it is running [obsidian unix domain socket rest](https://github.com/talwrii/obsidian-uds-rest)

This code is AI-generated and unreviewed

## Motivation
I want to read from obsidian from claude code. MCP feels like overkill and too many moving parts. There is a REST interface, but I don't really like messing around with curl so this is the beginnings of a wrapper. It is far from complete.

I changed the HTTP wrapper so it used unix domain sockets because I dislike having privileged services run on ports. On the other hand, I think the REST plugin provides a security token. Bt I still prefer unix domain sockets.


## Alternatives and prior work
emacsclient is an inspiration.


## Thinks to add
I will probabl allow this run arbitrary code at some point.
