import { ItemView, WorkspaceLeaf, loadMermaid, TFile } from "obsidian";
import * as d3 from 'd3';
import { unified } from "unified";
import MDAST from "mdast";
import UNIST from "unist";
import remarkParse from "remark-parse";
import remarkWikiLink from "remark-wiki-link";
import { visit } from "unist-util-visit";
import { MermaidTreeSettings } from "main";

export function hashCode(str: string): number {
  var hash = 0,
    i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

export const VIEW_TYPE_EXAMPLE = "mermaid-tree-view";

interface TextNode extends UNIST.Node {
  type: "text";
  value: string;
}

type SyntaxTree = MDAST.Root | WikiLinkNode | TextNode;


interface WikiLinkNode extends UNIST.Node {
  type: "wikiLink";
  value: string;
  data: {
    alias: string;
    permalink: string;
  };
}

export class MermaidTreeView extends ItemView {

  container: Element;
  settings: MermaidTreeSettings

  constructor(leaf: WorkspaceLeaf, settings: MermaidTreeSettings) {
    super(leaf);
    this.settings = settings;
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return "Example view";
  }

  parseOutgoingListLinks(parsedDocumentContent: SyntaxTree, search: String) {
    const documentLinks: string[] = [];
    visit(parsedDocumentContent, 'listItem', (listNode) => {
      visit(listNode, 'text', (textNode) => {
        if (textNode.value === search) {
          visit(listNode, "wikiLink", (wikiLinkNode: WikiLinkNode) => {
            const value = wikiLinkNode.value;
            const alias = wikiLinkNode.data.alias;
            const linkName = `${wikiLinkNode.value}${value !== alias ? ":" + alias : ""}`;
            documentLinks.push(linkName);
          });
        }
      });
    });
    return documentLinks;
  }

  getParentsFromSection(content: string, listName: string) {
    const documentParser = unified().use(remarkParse).use(remarkWikiLink);
    const documentLinksMap: { [key: string]: string[] } = {};
    const parsedDocumentContent = documentParser.parse(content);
    return this.parseOutgoingListLinks(parsedDocumentContent, listName);
  }


  async recursiveCall(file: TFile, set: Set<string>, internalLinks: Set<string>) {

    const content = await this.app.vault.cachedRead(file);
    const parents = this.getParentsFromSection(content, this.settings.section);
    const files = this.app.vault.getMarkdownFiles();

    for (let i = 0; i < parents.length; i++) {
      const parentFile = files.find(item => item.basename === parents[i])

      if (parentFile) {
        const id = hashCode(file.basename);
        const parentId = hashCode(parentFile?.basename);
        set.add(`${id}[${file.basename}] --> ${parentId}[${parentFile?.basename}]`);
        internalLinks.add(`class ${parentId} internal-link`);
        internalLinks.add(`class ${id} internal-link`);
        await this.recursiveCall(parentFile, set, internalLinks);
      }
    }

  }


  async renderFromFile(file: TFile | null) {

    this.container.empty();

    if (file != null) {

      const set: Set<string> = new Set<string>();
      const internalLinks: Set<string> = new Set<string>();

      await this.recursiveCall(file, set, internalLinks);

      var graphList = [];
      graphList.push("graph TD \n")

      set.forEach(item => {
        graphList.push(item + "\n");
      });

      internalLinks.forEach(item => {
        graphList.push(item + "\n");
      });

      const graphString = graphList.join("");



      loadMermaid().then(mermaid => {

        const graph = mermaid.mermaidAPI.render("mermaid-graph", graphString)

        const mydiv = this.container.createEl("div");
        mydiv.classList.add("mermaid")
        mydiv.innerHTML = graph


        d3.select('svg#mermaid-graph')
          .attr("preserveAspectRatio", "xMidYMin slice")
          .attr("viewBox", "0 0 60 55")
          .attr("style", "width: 100%; padding-bottom: 92%; height: 1px; overflow: visible");

        let zoom = d3.zoom()
          .on('zoom', (e) => {
            d3.select('svg g')
              .attr('transform', e.transform);
          });

        d3.select('.mermaid').call(zoom)


        const gs = mydiv.querySelectorAll("#mermaid-graph .nodes .internal-link")
        gs.forEach(element => {
          const childDiv: HTMLDivElement | null = element.querySelector("div");
          if (childDiv) {
            const name = childDiv.innerHTML;
            childDiv.innerHTML = ""
            const link = childDiv.createEl("a");
            link.href = name;
            link.innerHTML = name;
            link.addEventListener('click', e => {
              this.app.workspace.openLinkText(name, name, false);
            })
          }
        });

      });

    }

  }

  async onOpen() {

    console.log(this.settings.section);
    

    this.container = this.containerEl.children[1];
    this.container.empty();
    const activeFile = this.app.workspace.getActiveFile();
    this.renderFromFile(activeFile);
    this.app.workspace.on('file-open', file => this.renderFromFile(file));
  }

  async onClose() {

  }
}
