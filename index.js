/**
 * Host half of the standalone dark reading-contrast plugin.
 *
 * It contributes two rows to the served index HTML: one static stylesheet
 * holding every contrast level (plus the dark canvas used before the token
 * sheets load), and one body script that reads the stored level and writes
 * `body[data-dsh-contrast]` before first paint. The browser half owns the
 * Settings row and every later write; both halves share the level ids,
 * attribute name, and localStorage key declared here.
 */

/** Contrast levels from the softest to the hardest dark reading contrast. */
const LEVELS = ['soft', 'muted', 'comfortable', 'crisp', 'high']

/** Level applied when the browser has stored none and no previous run applied one. */
const DEFAULT_LEVEL = 'comfortable'

/** localStorage key holding the chosen level. */
const STORAGE_KEY = 'dsh:dark-contrast'

/** Body attribute selecting the level's token overrides. */
const ATTRIBUTE = 'data-dsh-contrast'

/** Attribute the in-tree theme setting uses, read once to seed an install's first level. */
const NATIVE_ATTRIBUTE = 'data-ds-dark-contrast'

/**
 * Boot canvas per level: the static neutral-bluish 850 / 875 / 900 / 950 /
 * 1000 steps. The stylesheet below stays the color authority for the mounted
 * app; this record only colors the document before those tokens resolve.
 */
const CANVAS = {
  soft: '#2c2c2e',
  muted: '#232324',
  comfortable: '#1b1b1c',
  crisp: '#151517',
  high: '#0f1115',
}

/**
 * Level stylesheet. Every level rule is qualified by `:root` so it outranks
 * the in-tree dark palette rules on a build that ships them, and stays
 * harmless on a build that does not.
 */
const CONTRAST_CSS = `body[data-ds-dark-theme] {
  background-color: var(--dsh-contrast-boot-bg, #1b1b1c);
}

:root body[data-ds-dark-theme] {
  --dsw-linear-gradient-think: linear-gradient(180deg, var(--dsw-alias-bg-base) 20.19%, color-mix(in srgb, var(--dsw-alias-bg-base) 0%, transparent) 100%);
  --dsw-linear-think-select: linear-gradient(180deg, var(--dsw-specific-sidebar-fill) 20.19%, color-mix(in srgb, var(--dsw-specific-sidebar-fill) 0%, transparent) 100%);
}

:root body[data-ds-dark-theme][data-dsh-contrast="soft"] {
  --dsw-alias-bg-base: var(--dsw-static-neutral-bluish-850);
  --dsw-alias-bg-document-preview: var(--dsw-static-neutral-bluish-850);
  --dsw-alias-label-primary: var(--dsw-static-neutral-bluish-300);
  --dsw-alias-label-primary-bluish: var(--dsw-static-neutral-bluish-300);
  --dsw-alias-label-primary-dimmed: var(--dsw-static-neutral-bluish-400);
  --dsw-specific-sidebar-fill: var(--dsw-static-neutral-bluish-800);
  --dsw-specific-login-input: var(--dsw-static-neutral-bluish-800);
  --dsw-alias-markdown-code-block: var(--dsw-static-neutral-bluish-800);
  --dsw-alias-markdown-code-block-banner: var(--dsw-static-neutral-bluish-800);
  --dsw-alias-markdown-code-segment-unselected: var(--dsw-static-neutral-bluish-800);
}

:root body[data-ds-dark-theme][data-dsh-contrast="muted"] {
  --dsw-alias-bg-base: var(--dsw-static-neutral-bluish-875);
  --dsw-alias-bg-document-preview: var(--dsw-static-neutral-bluish-875);
  --dsw-alias-label-primary: var(--dsw-static-neutral-bluish-300);
  --dsw-alias-label-primary-bluish: var(--dsw-static-neutral-bluish-300);
  --dsw-alias-label-primary-dimmed: var(--dsw-static-neutral-bluish-400);
  --dsw-specific-sidebar-fill: var(--dsw-static-neutral-bluish-850);
  --dsw-specific-login-input: var(--dsw-static-neutral-bluish-850);
  --dsw-alias-markdown-code-block: var(--dsw-static-neutral-bluish-850);
  --dsw-alias-markdown-code-block-banner: var(--dsw-static-neutral-bluish-850);
  --dsw-alias-markdown-code-segment-unselected: var(--dsw-static-neutral-bluish-850);
}

:root body[data-ds-dark-theme][data-dsh-contrast="comfortable"] {
  --dsw-alias-bg-base: var(--dsw-static-neutral-bluish-900);
  --dsw-alias-bg-document-preview: var(--dsw-static-neutral-bluish-900);
  --dsw-alias-label-primary: var(--dsw-static-neutral-bluish-200);
  --dsw-alias-label-primary-bluish: var(--dsw-static-neutral-bluish-200);
  --dsw-alias-label-primary-dimmed: var(--dsw-static-neutral-bluish-300);
  --dsw-specific-sidebar-fill: var(--dsw-static-neutral-bluish-875);
  --dsw-specific-login-input: var(--dsw-static-neutral-bluish-875);
  --dsw-alias-markdown-code-block: var(--dsw-static-neutral-bluish-850);
  --dsw-alias-markdown-code-block-banner: var(--dsw-static-neutral-bluish-850);
  --dsw-alias-markdown-code-segment-unselected: var(--dsw-static-neutral-bluish-850);
}

:root body[data-ds-dark-theme][data-dsh-contrast="crisp"] {
  --dsw-alias-bg-base: var(--dsw-static-neutral-bluish-950);
  --dsw-alias-bg-document-preview: var(--dsw-static-neutral-bluish-950);
  --dsw-alias-label-primary: var(--dsw-static-neutral-bluish-100);
  --dsw-alias-label-primary-bluish: var(--dsw-static-neutral-bluish-100);
  --dsw-alias-label-primary-dimmed: var(--dsw-static-neutral-bluish-200);
  --dsw-specific-sidebar-fill: var(--dsw-static-neutral-bluish-900);
  --dsw-specific-login-input: var(--dsw-static-neutral-bluish-900);
  --dsw-alias-markdown-code-block: var(--dsw-static-neutral-bluish-875);
  --dsw-alias-markdown-code-block-banner: var(--dsw-static-neutral-bluish-875);
  --dsw-alias-markdown-code-segment-unselected: var(--dsw-static-neutral-bluish-875);
}

:root body[data-ds-dark-theme][data-dsh-contrast="high"] {
  --dsw-alias-bg-base: var(--dsw-static-neutral-bluish-1000);
  --dsw-alias-bg-document-preview: var(--dsw-static-neutral-bluish-1000);
  --dsw-alias-label-primary: var(--dsw-static-neutral-bluish-50);
  --dsw-alias-label-primary-bluish: var(--dsw-static-neutral-bluish-50);
  --dsw-alias-label-primary-dimmed: var(--dsw-static-neutral-bluish-100);
  --dsw-specific-sidebar-fill: var(--dsw-static-neutral-bluish-950);
  --dsw-specific-login-input: var(--dsw-static-neutral-bluish-950);
  --dsw-alias-markdown-code-block: var(--dsw-static-neutral-bluish-900);
  --dsw-alias-markdown-code-block-banner: var(--dsw-static-neutral-bluish-900);
  --dsw-alias-markdown-code-segment-unselected: var(--dsw-static-neutral-bluish-900);
}
`

/**
 * Pre-paint body script: resolve the level (stored, else the level an in-tree
 * theme setting already wrote, else the default), apply the attribute, and
 * publish the level's canvas to the stylesheet above. Runs after the in-tree
 * theme boot script, which is why the native attribute and the resolved dark
 * flag are readable here; the boot-page canvas is only overridden while that
 * flag is dark, so a light load keeps the in-tree light value.
 */
const BOOT_SCRIPT = `(() => {
  const levels = ${JSON.stringify(LEVELS)}
  const canvas = ${JSON.stringify(CANVAS)}
  let level = null
  try {
    level = window.localStorage.getItem(${JSON.stringify(STORAGE_KEY)})
  } catch (error) {
    level = null
  }
  if (levels.indexOf(level) === -1) {
    const native = document.body.getAttribute(${JSON.stringify(NATIVE_ATTRIBUTE)})
    level = levels.indexOf(native) === -1 ? ${JSON.stringify(DEFAULT_LEVEL)} : native
    try {
      window.localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, level)
    } catch (error) {
      /* Storage refused: the attribute still colors this load. */
    }
  }
  document.body.setAttribute(${JSON.stringify(ATTRIBUTE)}, level)
  document.body.style.setProperty('--dsh-contrast-boot-bg', canvas[level])
  if (document.body.hasAttribute('data-ds-dark-theme')) {
    document.body.style.setProperty('--dsh-boot-bg', canvas[level])
  }
})()`

/**
 * Register the boot rows on every index render.
 * @param ctx - host context carrying the webserver index-injection event.
 */
export function apply(ctx) {
  ctx.on('webserver/index-inject', (table) => {
    table.push(
      { kind: 'style', text: CONTRAST_CSS },
      { kind: 'script', placement: 'body', text: BOOT_SCRIPT },
    )
  })
}
