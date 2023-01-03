import MermaidTree from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class MermaidTreeSettingTab extends PluginSettingTab {
  plugin: MermaidTree;

  constructor(app: App, plugin: MermaidTree) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Section")
      .setDesc("Section to recursive render")
      .addText((text) =>
        text
          .setPlaceholder("")
          .setValue(this.plugin.settings.section)
          .onChange(async (value) => {
            this.plugin.settings.section = value;
            await this.plugin.saveSettings();
          })
      );
  }
}