import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import * as http from "http";
import * as fs from "fs";

import RequestHandler from "./requestHandler";
import { LocalRestApiSettings } from "./types";

import {
  DEFAULT_SETTINGS,
} from "./constants";
import LocalRestApiPublicApi from "./api";
import { PluginManifest } from "obsidian";

export default class LocalRestApi extends Plugin {
  settings: LocalRestApiSettings;
  server: http.Server | null = null;
  requestHandler: RequestHandler;
  refreshServerState: () => void;

  async onload() {
    this.refreshServerState = this.debounce(
      this._refreshServerState.bind(this),
      1000
    );

    await this.loadSettings();
    this.requestHandler = new RequestHandler(
      this.app,
      this.manifest,
      this.settings
    );
    this.requestHandler.setupRouter();

    this.addSettingTab(new LocalRestApiSettingTab(this.app, this));

    this.refreshServerState();

    this.app.workspace.trigger("obsidian-local-rest-api:loaded");
  }

  getPublicApi(pluginManifest: PluginManifest): LocalRestApiPublicApi {
    if (!pluginManifest.id || !pluginManifest.name || !pluginManifest.version) {
      throw new Error(
        "PluginManifest instance must include a defined id, name, and version to be accempted."
      );
    }

    console.log("[REST API] Added new API extension", pluginManifest);

    return this.requestHandler.registerApiExtension(pluginManifest);
  }

  debounce<F extends (...args: any[]) => any>(
    func: F,
    delay: number
  ): (...args: Parameters<F>) => void {
    let debounceTimer: NodeJS.Timeout;
    return (...args: Parameters<F>): void => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func(...args), delay);
    };
  }

  _refreshServerState() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    // Remove old socket file if it exists
    if (fs.existsSync(this.settings.socketPath)) {
      fs.unlinkSync(this.settings.socketPath);
    }

    this.server = http.createServer(this.requestHandler.api);
    this.server.listen(this.settings.socketPath, () => {
      console.log(`[REST API] Listening on Unix socket: ${this.settings.socketPath}`);
      // Set socket permissions to user-only (0600)
      fs.chmodSync(this.settings.socketPath, 0o600);
    });
  }

  onunload() {
    if (this.server) {
      this.server.close();
    }
    // Clean up socket file
    if (fs.existsSync(this.settings.socketPath)) {
      fs.unlinkSync(this.settings.socketPath);
    }
  }

  async loadSettings() {
    const vaultPath = (this.app.vault.adapter as any).basePath;
    const defaultSocketPath = `${vaultPath}/.obsidian/obsidian.sock`;
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      { socketPath: defaultSocketPath },
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class LocalRestApiSettingTab extends PluginSettingTab {
  plugin: LocalRestApi;
  showAdvancedSettings = false;

  constructor(app: App, plugin: LocalRestApi) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.classList.add("obsidian-uds-rest-settings");

    containerEl.createEl("h2", { text: "Unix Domain Sockets REST API" });

    const infoDiv = containerEl.createEl("div");
    infoDiv.createEl("p", {
      text: "This plugin provides a REST API over Unix domain sockets. Access is controlled via filesystem permissions - only processes running as your user can connect to the socket."
    });

    infoDiv.createEl("p").innerHTML = `
      Socket location: <code>${this.plugin.settings.socketPath}</code>
    `;

    infoDiv.createEl("p").innerHTML = `
      Comprehensive documentation of available API endpoints can be found in
      <a href="https://coddingtonbear.github.io/obsidian-local-rest-api/">the online docs</a>
      (note: authentication examples can be ignored).
    `;

    containerEl.createEl("h3", { text: "Settings" });

    new Setting(containerEl)
      .setName("Socket Path")
      .setDesc("Path to the Unix domain socket file")
      .addText((text) =>
        text
          .setPlaceholder(".obsidian/obsidian.sock")
          .setValue(this.plugin.settings.socketPath)
          .onChange(async (value) => {
            this.plugin.settings.socketPath = value || "/tmp/obsidian.sock";
            await this.plugin.saveSettings();
            this.plugin.refreshServerState();
          })
      );
  }
}

export const getAPI = (
  app: App,
  manifest: PluginManifest
): LocalRestApiPublicApi | undefined => {
  const plugin = app.plugins.plugins["obsidian-local-rest-api"];
  if (plugin) {
    return (plugin as unknown as LocalRestApi).getPublicApi(manifest);
  }
};
