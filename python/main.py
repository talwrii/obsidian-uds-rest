#!/usr/bin/env python3
import os
import sys
import urllib.parse
import click
import requests_unixsocket

DEFAULT_SOCKET = os.path.expanduser("~/.obsidian/obsidian.sock")


def get_socket_path():
    if "OBSIDIAN_SOCKET" in os.environ:
        return os.environ["OBSIDIAN_SOCKET"]

    # Try to find socket in common locations
    candidates = [
        os.path.expanduser("~/all/.obsidian/obsidian.sock"),
        "/tmp/obsidian.sock",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path

    raise click.ClickException(
        "Could not find Obsidian socket. Set OBSIDIAN_SOCKET environment variable."
    )


def make_request(method, path, **kwargs):
    socket_path = get_socket_path()
    encoded_socket = urllib.parse.quote(socket_path, safe="")
    url = f"http+unix://{encoded_socket}{path}"

    session = requests_unixsocket.Session()
    response = session.request(method, url, **kwargs)
    return response


@click.group()
def cli():
    """CLI for Obsidian via Unix domain sockets."""
    pass


@cli.command()
def status():
    """Show server status."""
    response = make_request("GET", "/")
    click.echo(response.text)


@cli.command()
def active():
    """Get the currently active file path."""
    response = make_request("HEAD", "/active/")
    full_path = response.headers.get("X-Full-Path")
    if full_path:
        click.echo(full_path)
    else:
        raise click.ClickException("No active file")


@cli.command()
def read():
    """Read the currently active file contents."""
    response = make_request("GET", "/active/")
    click.echo(response.text)


@cli.command()
@click.argument("path")
def get(path):
    """Read a file from the vault."""
    response = make_request("GET", f"/vault/{path}")
    if response.status_code == 404:
        raise click.ClickException(f"File not found: {path}")
    click.echo(response.text)


@cli.command("list")
@click.argument("path", default="")
def list_files(path):
    """List files in the vault."""
    if path and not path.endswith("/"):
        path = path + "/"
    response = make_request("GET", f"/vault/{path}")
    if response.status_code == 404:
        raise click.ClickException(f"Path not found: {path}")
    data = response.json()
    for f in data.get("files", []):
        click.echo(f)


@cli.command()
@click.argument("query")
def search(query):
    """Search the vault."""
    response = make_request("POST", f"/search/simple/?query={urllib.parse.quote(query)}")
    for result in response.json():
        click.echo(result["filename"])


if __name__ == "__main__":
    cli()
