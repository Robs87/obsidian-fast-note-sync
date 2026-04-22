import { App, Notice, TFolder } from "obsidian";
import JSZip from "jszip";
import type FastSync from "../main";
import { dump, getPluginDir } from "./helps";

export class PluginManager {
    constructor(private app: App, private plugin: FastSync) { }

    /**
     * 解压并保存插件文件
     * 自动识别压缩包内的文件路径 (解决 GitHub zip 可能包含顶层目录的问题)
     */
    async unzipAndSave(zipData: ArrayBuffer): Promise<boolean> {
        try {
            const jszip = new JSZip();
            const zip = await jszip.loadAsync(zipData);
            const adapter = this.app.vault.adapter;
            const configDir = this.app.vault.configDir;
            const pluginPath = getPluginDir(this.plugin);

            // 检查目录是否存在，不存在则创建
            if (!(await adapter.exists(pluginPath))) {
                await adapter.mkdir(pluginPath);
            }

            // 核心文件列表
            const coreFiles = ["main.js", "manifest.json", "styles.css"];
            let extractedCount = 0;

            // 遍历 zip 寻找核心文件 (深度优先，找到即用)
            // 处理情况：文件可能在根目录，也可能在 zip 的唯一子目录下
            const findAndExtract = async (targetName: string) => {
                const results = Object.keys(zip.files).filter(path => path.endsWith(`/${targetName}`) || path === targetName);
                if (results.length > 0) {
                    // 优先选择路径最短的 (通常是包根目录)
                    results.sort((a, b) => a.length - b.length);
                    const targetPath = results[0];
                    const file = zip.file(targetPath);
                    if (file) {
                        const content = await file.async("arraybuffer");
                        await adapter.writeBinary(`${pluginPath}/${targetName}`, content);
                        extractedCount++;
                        return true;
                    }
                }
                return false;
            };

            for (const filename of coreFiles) {
                await findAndExtract(filename);
            }

            return extractedCount > 0;
        } catch (e) {
            console.error("unzipAndSave error:", e);
            return false;
        }
    }

    /**
     * 重载插件逻辑 (BRAT 式)
     * 禁用 -> 加载配置 -> 启用
     */
    async reloadPlugin() {
        try {
            const id = this.plugin.manifest.id;
            const plugins = (this.app as any).plugins;

            // 1. 禁用插件
            await plugins.disablePlugin(id);

            // 2. 重新加载插件配置文件列表 (识别新版本 manifest)
            await plugins.loadManifests();

            // 3. 重新启用插件
            // 注意：enablePlugin 会重新触发插件的 onload
            await plugins.enablePlugin(id);

            return true;
        } catch (e) {
            console.error("reloadPlugin error:", e);
            return false;
        }
    }
}
