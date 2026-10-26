# dsh-dark-contrast

English | [中文](README.zh.md)

A standalone DeepSeek Harness plugin that adds a **Dark contrast** row to Settings → General and
steps the dark palette through five reading-contrast levels: soft, muted, comfortable, crisp, high.

- Dark appearance only; light appearance is untouched.
- The first run adopts the level the interface already applies, so nothing jumps.
- The choice is kept in `localStorage` under `dsh:dark-contrast`, and the host half writes the level
  to `body[data-dsh-contrast]` before first paint, so the page does not flash and recolor.
- No build step and no third-party dependencies: the package is `index.js` (host), `client.js`
  (browser), `cordis.patch.yml` (bundle patch), and `package.json`.

## Install

### From a plugin market index (recommended)

1. Open **Plugins** in the DSH Web sidebar, open **More** next to the experimental plugins, and turn
   on **Custom plugin market**.
2. In **Discover**, choose **Add index source** and enter
   `https://imliupu.github.io/dsh-dark-contrast/site/index.json`.
3. Search for "dark contrast", install the listed version, then reload the page.

### From this repository

````text
plugin_manager install_bundle "git+https://github.com/imliupu/dsh-dark-contrast.git"
````

Or clone the repository anywhere and install the directory by absolute path:

````text
plugin_manager install_bundle "/path/to/dsh-dark-contrast"
````

Reload the page afterwards; the row appears under Settings → General. Remove it from the Plugins page
or with `plugin_manager remove_bundle dsh-dark-contrast`; the interface returns to its previous look.

## How it works

- Each level is a `body[data-dsh-contrast="<level>"]` rule set overriding `--dsw-*` tokens (canvas,
  primary label, sidebar, code blocks). The selectors carry a `:root` prefix, so they also win on a
  build that ships its own contrast implementation.
- The row registers into the `settings.general.item` slot under the shipped row id `dark-contrast`
  with a lower priority, so it replaces that row instead of stacking a second one beside it.
- The stepper arrows are inline SVG rather than `ui-primitives` icon exports: those exports are
  renamed between releases (`IconChevronUpOutline14` → `IconChevronUpOutlineRegular`), and inlining
  keeps the plugin working across them.
- Row copy lives in the plugin's own locale namespace `settings.dark-contrast` (Chinese and English);
  the plugin card title and description come from `locale/en.json` and `locale/zh.json`.

## Requirements

`dsh >= 0.1.6-alpha.2` (needs `webserver/index-inject` and the dynamic client bundle protocol).
Verified against `0.1.6-alpha.2` and `0.2.1-rc.2` for the `style` / `script` index-injection rows,
the `settings.general.item` slot with `priority` shadowing, the `defineStore` `init` / `actions`
shape, `ctx.locale.register(namespace, { zh, en })`, and the `--dsw-*` token names.

## Releasing (maintainer)

1. Bump `version` in `package.json`, commit, tag: `git tag v<version> && git push --tags`.
2. Regenerate the market index from a DSH checkout:

   ````sh
   pnpm --filter @deepseek-ai/dsh-plugin-market-generator start \
     --input plugins.txt --output site/index.json --title "imliupu's DSH plugins"
   ````

3. Commit `site/` (`index.json` and `icons/`) and push; the index URL above stays stable.

## License

[MIT](LICENSE)
