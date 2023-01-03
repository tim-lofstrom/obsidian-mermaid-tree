import { MermaidTreeView, VIEW_TYPE_EXAMPLE } from "mermaid-tree-view";
import { Notice, Plugin } from "obsidian";
import { MermaidTreeSettingTab } from "mermaid-tree-settings";

export interface MermaidTreeSettings {
  section: string;
}

const DEFAULT_SETTINGS: Partial<MermaidTreeSettings> = {
  section: "",
};

export default class MermaidTree extends Plugin {

  settings: MermaidTreeSettings;


  async activateView() {

    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)

    if (views.length == 0) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: VIEW_TYPE_EXAMPLE,
        active: true,
      });

    }

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]
    );
  }

  async onunload() {
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload() {

    await this.loadSettings();

    this.addSettingTab(new ExampleSettingTab(this.app, this));

    this.registerView(
      VIEW_TYPE_EXAMPLE,
      (leaf) => new ExampleView(leaf, this.settings)
    );

    this.addRibbonIcon("dice", "Activate view", () => {
      this.activateView();
    });

    this.addCommand({
      id: "sample-plugin-activate-view",
      name: "Activate view",
      callback: () => {
        this.activateView();
      },
    });



  }
}