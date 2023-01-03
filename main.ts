import { MermaidTreeView, VIEW_TYPE_MERMAID_TREE } from "mermaid-tree-view";
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

    const views = this.app.workspace.getLeavesOfType(VIEW_TYPE_MERMAID_TREE)

    if (views.length == 0) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: VIEW_TYPE_MERMAID_TREE,
        active: true,
      });

    }

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_MERMAID_TREE)[0]
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

    this.addSettingTab(new MermaidTreeSettingTab(this.app, this));

    this.registerView(
      VIEW_TYPE_MERMAID_TREE,
      (leaf) => new MermaidTreeView(leaf, this.settings)
    );

    this.addRibbonIcon("dice", "Mermaid Tree Show", () => {
      this.activateView();
    });

    this.addCommand({
      id: "obsidian-mermaid-tree-activate-view",
      name: "Mermaid Tree Show",
      callback: () => {
        this.activateView();
      },
    });



  }
}