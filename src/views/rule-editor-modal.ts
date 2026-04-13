import { App, Modal, Setting, setIcon, MarkdownRenderer, Component } from "obsidian";
import { SyncRule } from "../lib/helps";
import { $ } from "../i18n/lang";

export class RuleEditorModal extends Modal {
  private rules: SyncRule[];
  private onSave: (rules: SyncRule[]) => void;
  private description: string;
  private component: Component;

  constructor(app: App, title: string, description: string, rules: SyncRule[], onSave: (rules: SyncRule[]) => void) {
    super(app);
    this.titleEl.setText(title);
    this.description = description;
    this.rules = [...rules];
    this.onSave = onSave;
    this.component = new Component();
  }

  onOpen() {
    this.component.load();
    this.render();
  }

  private render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("fns-rule-editor-modal");

    if (this.description) {
      const descEl = contentEl.createDiv("fns-rule-editor-desc");
      MarkdownRenderer.render(this.app, this.description, descEl, "", this.component);
    }

    const listEl = contentEl.createDiv("fns-rule-list");

    this.rules.forEach((rule, index) => {
      const rowEl = listEl.createDiv("fns-rule-row");

      // 输入框
      const inputEl = rowEl.createEl("input", {
        type: "text",
        value: rule.pattern,
        cls: "fns-rule-input",
        placeholder: $("setting.sync.exclude_placeholder")
      });
      inputEl.onchange = (e) => {
        this.rules[index].pattern = (e.target as HTMLInputElement).value;
      };

      // 大小写敏感开关 (Aa)
      const caseBtn = rowEl.createEl("button", {
        text: "Aa",
        cls: "fns-case-toggle" + (rule.caseSensitive ? " is-active" : ""),
        title: "Case Sensitive"
      });
      caseBtn.onclick = () => {
        this.rules[index].caseSensitive = !this.rules[index].caseSensitive;
        caseBtn.toggleClass("is-active", this.rules[index].caseSensitive);
      };

      // 删除按钮
      const deleteBtn = rowEl.createEl("button", {
        cls: "fns-rule-delete",
        title: $("ui.button.delete")
      });
      setIcon(deleteBtn, "trash");
      deleteBtn.onclick = () => {
        this.rules.splice(index, 1);
        this.render();
      };
    });

    // 添加规则按钮
    const addContainer = contentEl.createDiv("fns-rule-add-container");
    const addBtn = addContainer.createEl("button", {
      text: $("ui.button.add_rule") || "Add Rule",
      cls: "fns-rule-add"
    });
    addBtn.onclick = () => {
      this.rules.push({ pattern: "", caseSensitive: false });
      this.render();
    };

    // 底部操作按钮
    const footerEl = contentEl.createDiv("fns-rule-editor-footer");
    
    const saveBtn = footerEl.createEl("button", {
      text: $("ui.button.save") || "Save",
      cls: "mod-cta"
    });
    saveBtn.onclick = () => {
      this.onSave(this.rules.filter(r => r.pattern.trim() !== ""));
      this.close();
    };

    const cancelBtn = footerEl.createEl("button", {
      text: $("ui.button.cancel") || "Cancel"
    });
    cancelBtn.onclick = () => {
      this.close();
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}
