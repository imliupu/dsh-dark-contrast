# dsh-dark-contrast — 独立的「深色对比」插件

[English](README.md) | 中文

把通用设置里的**深色对比**做成一个自带完整实现的 DSH 插件，不依赖任何内置主题改动，
可以单独安装、单独分发。

- 在 **设置 → 通用** 里新增「深色对比」一行：柔和 / 较柔 / 舒适 / 较鲜明 / 鲜明五档。
- 只影响深色外观；浅色外观不受影响。
- 首次安装会读取当前界面已有的深色档位作为初始值，外观不会跳变。
- 选择结果存在浏览器 `localStorage`（键名 `dsh:dark-contrast`），刷新后仍然生效；
  宿主侧会在首屏绘制前把档位写到 `body[data-dsh-contrast]`，所以不会闪一下再变色。
- 零构建、零第三方依赖：包内就是 `index.js`（宿主侧）、`client.js`（浏览器侧）、
  `cordis.patch.yml`（组合补丁）和 `package.json`。

## 安装

### 从插件市场安装（推荐）

1. 在 DSH Web 里打开 **侧边栏 → 插件**，点击实验性插件旁的**更多**，打开**自定义插件市场**。
2. 在**发现**里选择**添加索引源**，填入市场索引 URL：
   `https://imliupu.github.io/dsh-dark-contrast/site/index.json`
3. 搜索「深色对比」或 `dark contrast`，安装，然后刷新页面。

### 从 Git 仓库安装

````text
plugin_manager install_bundle "git+https://github.com/imliupu/dsh-dark-contrast.git"
````

或者把仓库克隆到本地任意目录，用该目录的**绝对路径**安装：

````text
plugin_manager install_bundle "/path/to/dsh-dark-contrast"
````

安装完成后刷新页面，设置 → 通用里就会出现「深色对比」一行。卸载用插件页，
或 `plugin_manager remove_bundle dsh-dark-contrast`，卸载后界面恢复原样。

## 实现说明

- 档位通过 `body[data-dsh-contrast="<档位>"]` 选择一组 `--dsw-*` 令牌覆盖
  （底色、主文字、侧栏、代码块等），选择器带 `:root` 前缀，因此在自带深色对比实现的构建上
  也能稳定覆盖内置规则。
- 设置行注册进 `settings.general.item` 槽位，复用内置行的 id `dark-contrast` 并降低优先级，
  所以在已有该设置的构建上它是**替换**内置行而不是并排多出一行。
- 行内箭头是内联 SVG，不引用 `ui-primitives` 的图标导出——该包的图标名会随版本改名
  （例如 `IconChevronUpOutline14` → `IconChevronUpOutlineRegular`），内联后插件不受影响。
- 文案在插件自己的 locale 命名空间 `settings.dark-contrast` 内提供中英两套；
  插件卡片的中英文标题与描述来自 `locale/en.json`、`locale/zh.json`。

## 版本要求

`dsh >= 0.1.6-alpha.2`（需要 `webserver/index-inject` 与动态客户端 bundle 的加载协议）。
已在 `0.1.6-alpha.2` 与 `0.2.1-rc.2` 上核对过这些接口：`webserver/index-inject` 的
`style` / `script` 行、`settings.general.item` 槽位与 `priority` 遮蔽、`defineStore` 的
`init` / `actions` 形态、`ctx.locale.register(命名空间, { zh, en })`、以及
`--dsw-*` 令牌名。

## 维护者：发布新版本

1. 改 `package.json` 的 `version`，提交并打 tag：`git tag v<version> && git push --tags`。
2. 重新生成市场索引（在 dsh 仓库里运行）：

   ````sh
   pnpm --filter @deepseek-ai/dsh-plugin-market-generator start \
     --input plugins.txt --output site/index.json --title "imliupu 的 DSH 插件"
   ````

3. 提交 `site/`（`index.json` 与 `icons/`）并推送；索引地址保持
   `https://imliupu.github.io/dsh-dark-contrast/site/index.json` 不变。

## 许可证

[MIT](LICENSE)
