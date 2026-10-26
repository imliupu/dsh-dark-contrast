/**
 * Browser half of the standalone dark reading-contrast plugin.
 *
 * Registers one "Dark contrast" row into the Settings General section and
 * writes the chosen level to `body[data-dsh-contrast]`, the attribute the
 * host half's stylesheet keys on. The row reuses the shipped row id, so on a
 * build that already carries the setting this row replaces it instead of
 * stacking a second one beside it. The chosen level is remembered in
 * localStorage; the host half reads the same key before first paint.
 *
 * Variable names, level ids, and the storage key mirror index.js.
 */
window.__ModuleLoader__.load({
  id: 'dsh-dark-contrast',
  factory(require) {
    const React = require('react')
    const { defineStore } = require('@deepseek-ai/dsh-client-store')

    const LEVELS = ['soft', 'muted', 'comfortable', 'crisp', 'high']
    const DEFAULT_LEVEL = 'comfortable'
    const STORAGE_KEY = 'dsh:dark-contrast'
    const ATTRIBUTE = 'data-dsh-contrast'
    const NATIVE_ATTRIBUTE = 'data-ds-dark-contrast'

    /** Locale namespace holding this row's copy. */
    const NS = 'settings.dark-contrast'

    /** Row styles: the shipped General-row rhythm with a wider stepper pill. */
    const ROW_CSS = `.dshdc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
}

.dshdc-rowText {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 48px;
}

.dshdc-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
}

.dshdc-desc {
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}

.dshdc-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dshdc-stepper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 118px;
  height: 36px;
  border-radius: var(--dsw-radius-md, 12px);
  background: var(--dsw-alias-bg-module-platform);
}

.dshdc-value {
  min-width: 18px;
  text-align: center;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
}

.dshdc-arrows {
  position: absolute;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
}

.dshdc-stepper:hover .dshdc-arrows,
.dshdc-stepper:focus-within .dshdc-arrows {
  opacity: 1;
}

.dshdc-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 12px;
  padding: 0;
  border: none;
  border-radius: var(--dsw-radius-xs, 4px);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 75%, transparent);
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
}

.dshdc-arrow:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-1);
}

.dshdc-arrow:disabled {
  color: var(--dsw-alias-label-caption);
  cursor: default;
}
`

    const zh = {
      title: '深色对比',
      description: '仅影响深色外观',
      'level.soft': '柔和',
      'level.muted': '较柔',
      'level.comfortable': '舒适',
      'level.crisp': '较鲜明',
      'level.high': '鲜明',
      increase: '提高对比',
      decrease: '降低对比',
    }

    const en = {
      title: 'Dark contrast',
      description: 'Only affects the dark appearance',
      'level.soft': 'Soft',
      'level.muted': 'Muted',
      'level.comfortable': 'Comfortable',
      'level.crisp': 'Crisp',
      'level.high': 'High',
      increase: 'Increase contrast',
      decrease: 'Decrease contrast',
    }

    /** Whether a value is one of the five level ids. */
    function isLevel(value) {
      return typeof value === 'string' && LEVELS.indexOf(value) !== -1
    }

    /**
     * Current level: the stored one, else the level an in-tree theme setting
     * already applied, else the default.
     */
    function readLevel() {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (isLevel(stored)) return stored
      } catch (error) {
        /* Storage refused: fall through to the attribute the boot script wrote. */
      }
      const applied = document.body.getAttribute(ATTRIBUTE)
      if (isLevel(applied)) return applied
      const native = document.body.getAttribute(NATIVE_ATTRIBUTE)
      return isLevel(native) ? native : DEFAULT_LEVEL
    }

    /** Apply one level to the document and remember it for the next load. */
    function applyLevel(level) {
      document.body.setAttribute(ATTRIBUTE, level)
      try {
        window.localStorage.setItem(STORAGE_KEY, level)
      } catch (error) {
        /* Storage refused: the live attribute still applies this session. */
      }
    }

    /** Row state: the level the document currently applies. */
    function createRowStore(initial) {
      return defineStore({
        init: () => ({ level: initial }),
        actions: {
          set: (draft, level) => { draft.level = level },
        },
      })
    }

    /**
     * Stepper arrow artwork. Inlined rather than required from the UI
     * primitives package so the plugin keeps working when that package's icon
     * exports are renamed; the geometry matches its regular 16px chevron.
     */
    function Chevron(props) {
      return React.createElement('svg', {
        width: 9,
        height: 9,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        strokeWidth: 1,
      }, React.createElement('path', {
        d: props.up
          ? 'M12 10L8.70711 6.70711C8.31658 6.31658 7.68342 6.31658 7.29289 6.70711L4 10'
          : 'M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6',
        stroke: 'currentColor',
      }))
    }

    /**
     * One General-section row: title, dark-only description, and the stepper
     * pill that steps through the five levels.
     * @param props - composed slot props (locale seat, store seat, injected face).
     * @returns the row element tree.
     */
    function DarkContrastRow(props) {
      const level = props.useStore(state => state.level)
      const index = LEVELS.indexOf(level)
      const step = (offset) => {
        const next = LEVELS[index + offset]
        if (next !== undefined) props.setLevel(next)
      }
      return React.createElement('div', { className: 'dshdc-row' },
        React.createElement('div', { className: 'dshdc-rowText' },
          React.createElement('div', { className: 'dshdc-title' }, props.t('title')),
          React.createElement('div', { className: 'dshdc-desc' }, props.t('description'))),
        React.createElement('div', { className: 'dshdc-control' },
          React.createElement('div', { className: 'dshdc-stepper' },
            React.createElement('span', { className: 'dshdc-value' }, props.t(`level.${level}`)),
            React.createElement('span', { className: 'dshdc-arrows' },
              React.createElement('button', {
                type: 'button',
                className: 'dshdc-arrow',
                'aria-label': props.t('increase'),
                disabled: index >= LEVELS.length - 1,
                onClick: () => { step(1) },
              }, React.createElement(Chevron, { up: true })),
              React.createElement('button', {
                type: 'button',
                className: 'dshdc-arrow',
                'aria-label': props.t('decrease'),
                disabled: index <= 0,
                onClick: () => { step(-1) },
              }, React.createElement(Chevron, { up: false }))))))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-dark-contrast: row dictionaries')
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-dark-contrast'
          tag.textContent = ROW_CSS
          document.head.append(tag)
          return () => { tag.remove() }
        }, 'dsh-dark-contrast: row styles')
        const level = readLevel()
        applyLevel(level)
        const store = createRowStore(level)
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item',
          id: 'dark-contrast',
          order: 11,
          // Lower priority than the in-tree row so this registration is the
          // cell's winner on a build that already ships the setting.
          priority: -1,
          store,
          locale: NS,
          inject: actions => ({
            setLevel: (next) => {
              applyLevel(next)
              actions.set(next)
            },
          }),
        }, DarkContrastRow))
      },
    }
  },
})
