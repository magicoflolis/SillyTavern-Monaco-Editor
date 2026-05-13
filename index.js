/// <reference types="./index.d.ts" />
/// <reference types="./monaco.d.ts" />
// <https://github.com/microsoft/monaco-editor/blob/gh-pages/node_modules/monaco-editor/monaco.d.ts>

'use strict';

// ---------------------------------------------------------------------------

const MONACO_VERSION = '0.55.1';
const CDN_VS = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`;
const CDN_CSS = `${CDN_VS}/editor/editor.main.css`;
/** @type { { enabled: boolean; preloadOnStart: boolean; } & monaco.editor.IStandaloneEditorConstructionOptions } */
const DEFAULT_SETTINGS = {
    enabled: true,
    preloadOnStart: true,
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: 'on',
    // minimap: {
    //     enabled: false
    // },
    language: 'markdown',
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true
};
const DEFAULT_VALUE =
    '# SillyTavern\n\nLLM Frontend for Power Users\n\n## Resources\n\n- GitHub: <https://github.com/SillyTavern/SillyTavern>\n- Docs: <https://docs.sillytavern.app/>\n- Discord: <https://discord.gg/sillytavern>\n- Reddit: <https://reddit.com/r/SillyTavernAI>\n\n## License\n\nAGPL-3.0';
const MODULE_NAME = 'extension_monaco';
/** @returns {typeof DEFAULT_SETTINGS} */
const getSettings = () => {
    const { extensionSettings } = SillyTavern.getContext();
    // @ts-ignore
    if (!extensionSettings[MODULE_NAME])
        // @ts-ignore
        extensionSettings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
    // Ensure any new keys from future updates are present
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        // @ts-ignore
        if (!Object.hasOwn(extensionSettings[MODULE_NAME], key))
            // @ts-ignore
            extensionSettings[MODULE_NAME][key] = value;
    }
    // @ts-ignore
    return extensionSettings[MODULE_NAME];
};

// ---------------------------------------------------------------------------

// #region Utilities

// Common functions I use in my projects

// #region Console
class con extends null {
    static #title = '[%cMonaco Ext.%c]';
    static #color = 'color: rgb(6, 117, 190);';
    /**
     * @param {unknown[]} msg
     */
    static dbg(...msg) {
        const dt = new Date();
        console.debug(
            `${con.#title} %cDBG`,
            con.#color,
            '',
            'color: rgb(255, 212, 0);',
            `[${dt.getHours()}:${('0' + dt.getMinutes()).slice(-2)}:${('0' + dt.getSeconds()).slice(-2)}]`,
            ...msg
        );
    }
    /**
     * @param {unknown[]} msg
     */
    static err(...msg) {
        console.error(`${con.#title} %cERROR`, con.#color, '', 'color: rgb(249, 24, 128);', ...msg);
        const t = con.#title.replace(/%c/g, '');
        for (const e of msg.filter((i) => i instanceof Error)) {
            if ('cause' in e) con.alert(`${t} (${e.cause}) ${e.message}`);
        }
    }
    /**
     * @param {unknown[]} msg
     */
    static info(...msg) {
        console.info(`${con.#title} %cINF`, con.#color, '', 'color: rgb(0, 186, 124);', ...msg);
    }
    /**
     * @param {unknown[]} msg
     */
    static log(...msg) {
        console.log(`${con.#title} %cLOG`, con.#color, '', 'color: rgb(219, 160, 73);', ...msg);
    }
    /**
     * @param {unknown} message
     */
    static alert(message) {
        if (typeof window.alert !== 'undefined') window.alert(message);
    }
}
// #endregion
/**
 * Transform parameter into string
 * @template O
 * @param {O} obj
 * @returns {string}
 */
function objToStr(obj) {
    try {
        return Object.prototype.toString.call(obj).match(/\[object (.*)\]/)?.[1] || '';
    } catch {
        return '';
    }
}
/**
 * @template O
 * @param {O} obj
 * @returns {obj is () => unknown}
 */
const isFN = (obj) => /Function/.test(objToStr(obj));
/**
 * @template O
 * @param {O} obj
 * @returns {obj is (Window | Document | Element | HTMLElement | Node)}
 */
const isHTML = (obj) => /Window|Document|Element|HTML/.test(objToStr(obj));
/**
 * @template O
 * @param {O} obj
 * @returns {obj is (Document | Element | HTMLElement | Node)}
 */
const isElem = (obj) => /Document|Element|HTML/.test(objToStr(obj));
/**
 * Transform target into Array
 * @template T
 * @template {Record<string, boolean>} A
 * @param {T | null} [target] - The target to normalize into an array
 * @param {A} [args]
 * @param {Document | Element | HTMLElement | null} [root]
 * @returns {T extends null | undefined ? [] : T extends readonly unknown[] ? T : T extends Document | Element | HTMLElement ? [T] : T extends string ? A extends { split: true } ? string[] : root extends Document | Element | HTMLElement ? Element[] : [T] : A extends { entries: true } ? T extends Record<infer K, infer V> ? Array<[K extends string ? K : string, V]> : Array<[string, unknown]> : A extends { keys: true } ? T extends Record<infer K, unknown> ? Array<K extends string ? K : string> : T extends Set<unknown> | Map<infer K, unknown> ? K[] : string[] : A extends { values: true } ? T extends Record<string, infer V> ? V[] : T extends Set<infer V> | Map<unknown, infer V> ? V[] : unknown[] : T extends Iterable<infer U> ? U[] : unknown[]}
 */
function toArray(target, args, root) {
    args = Object.assign({}, args);
    // @ts-ignore
    if (target == null) return [];
    // @ts-ignore
    if (Array.isArray(target)) return target;
    // @ts-ignore
    if (isHTML(target)) return Array.of(target);
    /** @type {keyof typeof args | undefined} */
    const method = ['split', 'entries', 'keys', 'values'].find((key) => args[key]);
    if (typeof target === 'string') {
        if (isElem(root)) {
            // @ts-ignore
            return [...root.querySelectorAll(target)];
        }
        // @ts-ignore
        return method === 'split' ? [...target] : [target];
    }
    if (method != null) {
        const s = objToStr(target);
        const m = method === 'split' ? 'keys' : method;
        if (/Object/.test(s)) {
            // @ts-ignore
            if (Object[m]) return Array.from(Object[m](target));
        } else if (/Set|Map/.test(s)) {
            /** @type {Set<unknown> | Map<unknown, unknown>} */
            // @ts-ignore
            const prim = target;
            // @ts-ignore
            if (prim[m]) return Array.from(prim[m]());
        }
    }
    // @ts-ignore
    return Array.from(target);
}
/**
 * Parameter is `JSON Object`
 * @template O
 * @param {O} obj
 * @returns {obj is Record<PropertyKey, unknown>}
 */
const isObj = (obj) => /Object/.test(objToStr(obj));
/**
 * Parameter is `null` or `undefined`
 * @template O
 * @param {O} obj
 * @returns {obj is (null | undefined)}
 */
const isNull = (obj) => Object.is(obj, null) || Object.is(obj, undefined);
/**
 * Parameter is Blank
 * @template O
 * @param {O} obj
 * @returns {boolean}
 */
const isBlank = (obj) =>
    typeof obj === 'string'
        ? Object.is(obj.replaceAll('\0', '').trim(), '')
        : Object.is(toArray(obj, { split: true }).length, 0);
/**
 * Parameter is Empty
 * @template O
 * @param {O} obj
 * @returns {boolean}
 */
const isEmpty = (obj) => isNull(obj) || isBlank(obj);
/**
 * @type {stextension["qs"]}
 */
// @ts-ignore
const qs = (selectors, root) => {
    try {
        return (root || document).querySelector(selectors);
    } catch (ex) {
        con.err(ex);
        return null;
    }
};
/**
 * @type {stextension["qsA"]}
 */
// @ts-ignore
const qsA = (selectors, root) => {
    return (root || document).querySelectorAll(selectors);
};
/**
 * Add an event listener to the element/document/window
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)
 * @template {keyof HTMLElementEventMap} T
 * @template {Element} E
 * @param {E | E[]} el
 * @param {T} type
 * @param {(this: E, event: HTMLElementEventMap[T]) => *} listener
 * @param {boolean | AddEventListenerOptions} [options]
 * @see {@link window.addEventListener}
 * @see {@link document.addEventListener}
 * @see {@link Element.addEventListener}
 */
const ael = (el, type, listener, options) => {
    try {
        /** @type {unknown} */
        const _listener = listener;
        for (const elem of toArray(el).filter(isHTML)) {
            // @ts-ignore
            elem.addEventListener(type, _listener, options);
        }
    } catch (ex) {
        if (ex instanceof Error) ex.cause = 'addEventListener';
        con.err(ex);
    }
};
/**
 * @type {stextension["make"]}
 */
// @ts-ignore
const make = (tagName, cname, attrs) => {
    const el = document.createElement(tagName);
    /**
     * @param {typeof el} elem - HTMLElement
     * @param {unknown} str - Class string(s)
     */
    const addClass = (elem, str) => {
        /** @type {string[]} */
        const arr = (
            Array.isArray(str) ? str : typeof str === 'string' ? str.split(' ') : []
        ).filter((s) => !isEmpty(s));
        if (!isEmpty(arr)) elem.classList.add(...arr);
    };
    /**
     * Set attributes for an element
     * @template {typeof el} Elem
     * @param {Elem} elem - HTMLElement
     * @param {Elem[keyof Elem]} attr - Attributes for this HTMLElement
     */
    const formAttrs = (elem, attr) => {
        if (elem == null) return elem;
        if (isObj(attr)) {
            for (const [key, value] of Object.entries(attr)) {
                if (isObj(value)) {
                    // @ts-ignore
                    formAttrs(elem[key], value);
                } else if (isFN(value)) {
                    if (/^on/.test(key)) {
                        // @ts-ignore
                        elem[key] = value;
                        continue;
                    }
                    // @ts-ignore
                    ael(elem, key, value);
                } else if (/^class/i.test(key)) {
                    addClass(elem, value);
                    // @ts-ignore
                } else if (elem.tagName === 'A' && /^(download|type)/i.test(key)) {
                    // @ts-ignore
                    if (typeof value === 'string') elem.setAttribute(key, value);
                } else {
                    // @ts-ignore
                    elem[key] = value;
                }
            }
        }

        return elem;
    };
    if (!isEmpty(cname) && (typeof cname === 'string' || Array.isArray(cname))) addClass(el, cname);
    if (!isEmpty(attrs) && typeof attrs === 'string') el.textContent = attrs;
    if (/Object/.test(objToStr(cname))) formAttrs(el, cname);
    if (/Object/.test(objToStr(attrs))) formAttrs(el, attrs);
    return el;
};
/**
 * Create a MutationObserver for the element.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MutationObserver)
 * @template {Node} E
 * @param {E} element
 * @param {MutationCallback} listener
 * @param {MutationObserverInit} options
 * @returns {MutationObserver}
 */
const observe = (element, listener, options = { subtree: true, childList: true }) => {
    const observer = new MutationObserver(listener);
    observer.observe(element, options);
    listener.call(element, [], observer);
    return observer;
};
//#endregion

// ---------------------------------------------------------------------------

/** @type {Map<string, monaco.editor.ICodeEditorViewState | null>} */
const mapEditor = new Map();

/** @type {Map<string, monaco.editor.ITextModel | null>} */
const mapModel = new Map();

const initMonaco = () => {
    const monaco = globalThis.monaco;
    if (monaco) {
        monaco.languages.registerCompletionItemProvider(getSettings().language || 'markdown', {
            provideCompletionItems: function (model, position) {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                return {
                    suggestions: [
                        {
                            label: '{{user}}',
                            kind: monaco.languages.CompletionItemKind.Text,
                            detail: 'Your current Persona name.',
                            documentation: 'Your current Persona name.',
                            insertText: '{{user}}',
                            range: range
                        },
                        {
                            label: '{{char}}',
                            kind: monaco.languages.CompletionItemKind.Text,
                            detail: "The character's name.",
                            documentation: "The character's name.",
                            insertText: '{{char}}',
                            range: range
                        }
                    ]
                };
            }
        });
    }
};
/**
 * @returns {Promise<boolean>}
 */
const loadMonaco = async () => {
    return new Promise((resolve, reject) => {
        if (globalThis.monaco || qs(`script[data-insertedBy="${MODULE_NAME}"]`)) {
            resolve(true);
        }
        con.log(`Importing "v${MONACO_VERSION}"`);
        const settings = getSettings();
        const parent = document.head ?? document.body ?? document.documentElement;
        const loaderScript = make('script', {
            src: `${CDN_VS}/loader.js`,
            dataset: {
                insertedBy: MODULE_NAME
            }
        });
        ael(
            loaderScript,
            'load',
            () => {
                const r = window.require;
                // @ts-ignore
                r.config({ paths: { vs: CDN_VS } });
                r(
                    ['vs/editor/editor.main'],
                    // @ts-ignore
                    () => {
                        con.log(`Imported "v${MONACO_VERSION}"`);
                        initMonaco();
                        resolve(true);
                    },
                    () => {
                        settings.enabled = false;
                        SillyTavern.getContext().saveSettingsDebounced();
                        reject(new Error('Failed install loader from CDN'));
                    }
                );
            },
            { once: true }
        );
        ael(
            loaderScript,
            'error',
            () => {
                settings.enabled = false;
                SillyTavern.getContext().saveSettingsDebounced();
                reject(new Error('Failed to load Monaco loader from CDN'));
            },
            { once: true }
        );
        parent.appendChild(loaderScript);
    });
};

(() => {
    const settings = getSettings();
    if (settings.preloadOnStart && settings.enabled) {
        try {
            loadMonaco();
        } catch (e) {
            con.err('Background preload failed:', e);
        }
    }
})();

class CodeViewMonaco extends HTMLElement {
    /** @type {HTMLDivElement} */
    _;
    /** @type {monaco.editor.IStandaloneCodeEditor | undefined} */
    _editor;
    /** @type {?HTMLTextAreaElement} */
    _textElement = null;
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(
            make('link', {
                rel: 'stylesheet',
                type: 'text/css',
                href: CDN_CSS,
                dataset: {
                    name: 'vs/editor/editor.main',
                    insertedBy: MODULE_NAME
                }
            })
        );
        this._ = make('div', {
            id: `${MODULE_NAME}-container`,
            style: 'height: 100%; height: -moz-available; height: -webkit-fill-available; width: 100%; width: -moz-available; width: -webkit-fill-available; text-align: initial;'
        });
        shadowRoot.appendChild(this._);
    }
    disconnectedCallback() {
        if (this._editor) {
            const isDemo = (this.textElement && this.textElement.id === 'monaco-demo') || false;
            /** @type {?HTMLTextAreaElement} */
            const fallback = qs('.monaco-playground-after');
            if (fallback && !isDemo) {
                const eValue = this._editor.getValue();
                if (!isEmpty(eValue)) {
                    fallback.value = eValue;
                }
            }
            if (this.textElement && this.textElement.dataset.monaco_id) {
                mapEditor.set(this.textElement.dataset.monaco_id, this._editor.saveViewState());
                // mapModel.set(this.textElement.dataset.monaco_id, this._editor.getModel());
            }
            this._editor.dispose();
        }
    }
    get textElement() {
        return this._textElement;
    }
    set textElement(elem) {
        if (elem) {
            if (this.dataset.monaco_id) {
                elem.dataset.monaco_id = this.dataset.monaco_id;
            }
            this._textElement = elem;
        }
    }
    /**
     * @param {monaco.editor.IStandaloneEditorConstructionOptions} options
     * @param {monaco.editor.ICommandHandler} [shortcutFN]
     * @returns {monaco.editor.IStandaloneCodeEditor}
     */
    createEditor(options = {}, shortcutFN) {
        if (!isObj(options)) throw new Error('"options" must be a JSON Object.');
        const monaco = globalThis.monaco;
        if (!monaco) throw new Error('"monaco" not yet initalized.');
        const settings = getSettings();
        const dt = this.dataset;
        this._editor = monaco.editor.create(this._, {
            automaticLayout: true,
            language: dt.language ?? settings.language,
            theme: dt.theme ?? settings.theme,
            fontSize: settings.fontSize,
            wordWrap: settings.wordWrap,
            lineNumbers: settings.lineNumbers,
            minimap: settings.minimap,
            tabSize: settings.tabSize,
            insertSpaces: settings.insertSpaces,
            scrollBeyondLastLine: settings.scrollBeyondLastLine,
            formatOnPaste: settings.formatOnPaste,
            value: DEFAULT_VALUE,
            ...options
        });
        if (this.textElement) {
            // @ts-ignore
            if (mapEditor.has(this.textElement.dataset.monaco_id)) {
                // @ts-ignore
                const state = mapEditor.get(this.textElement.dataset.monaco_id);
                // const model = mapModel.get(this.textElement.dataset.monaco_id);
                // if (model) this._editor.setModel(model);
                if (state) this._editor.restoreViewState(state);
            } else {
                this.textElement.dataset.monaco_id = this._editor.getId();
            }
        }

        this.dataset.monaco_id = this._editor.getId();
        // Keyboard shortcut: Ctrl+S / Cmd+S → save and close
        if (isFN(shortcutFN)) {
            this._editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, shortcutFN);
        }
        const isDemo = (this.textElement && this.textElement.id === 'monaco-demo') || false;
        /** @type {?HTMLTextAreaElement} */
        const fallback = qs('.monaco-playground-before');
        if (fallback && !isDemo) {
            const eValue = this._editor.getValue();
            if (!isEmpty(eValue)) fallback.value = eValue;
        }
        return this._editor;
    }
}

customElements.define('code-view-monaco', CodeViewMonaco);

/**
 * @global
 * @param {HTMLTextAreaElement} [textarea]
 * @param {monaco.editor.IStandaloneEditorConstructionOptions} options
 * @returns {CodeViewMonaco}
 */
const openMonacoEditor = (textarea, options = {}) => {
    if (!isObj(options)) throw new Error('"options" must be a JSON Object.');
    /** @type {CodeViewMonaco} */
    // @ts-ignore
    const cv = make('code-view-monaco');
    const { Popup, POPUP_TYPE, POPUP_RESULT } = SillyTavern.getContext();
    const popup = new Popup(cv, POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        okButton: 'Save',
        cancelButton: 'Close',
        onClosing: async () => {
            if (
                textarea instanceof HTMLTextAreaElement &&
                popup.result === POPUP_RESULT.AFFIRMATIVE
            ) {
                textarea.value = editor.getValue();
                textarea.dispatchEvent(new Event('input'));
                textarea.dispatchEvent(new Event('blur'));
            }
            cv.remove();
            return true;
        }
    });
    const opt = {
        value: textarea instanceof HTMLTextAreaElement ? textarea.value : DEFAULT_VALUE,
        ...options
    };
    if (textarea instanceof HTMLTextAreaElement) {
        cv.textElement = textarea;
    }
    const editor = cv.createEditor(opt, () => popup.completeAffirmative());
    if (textarea instanceof HTMLTextAreaElement) {
        editor.onDidBlurEditorText(() => {
            textarea.value = editor.getValue();
            textarea.dispatchEvent(new Event('input'));
            textarea.dispatchEvent(new Event('blur'));
        });
    }
    popup.show();
    editor.focus();
    return cv;
};
// @ts-ignore
globalThis.openMonacoEditor = openMonacoEditor;
const makeDrawer = (title = 'Monaco Editor') => {
    const elem = qs('[id="extensions_settings2"]');
    if (!elem || qs('.monaco-drawer')) return [];
    const inlineDrawer = make('div', 'inline-drawer monaco-drawer');
    const header = make('div', 'inline-drawer-toggle inline-drawer-header');
    const content = make('div', 'inline-drawer-content');
    const icon = make('div', 'inline-drawer-icon fa-solid fa-circle-chevron-down down');
    const b = make('b', { textContent: title, title });
    header.append(b, icon);
    inlineDrawer.append(header, content);
    elem.append(inlineDrawer);
    return [header, content];
};
/**
 * @param {string} title
 * @param {string} [infoText]
 */
const makeLabel = (title = '', infoText) => {
    const label = make('h3', {
        style: 'margin: 0px; display: flex; align-items: center; gap: .5em;'
    });
    const b = make('span', { style: 'user-select: none;', textContent: title, title });
    const info = make('i', 'fa-solid fa-info-circle', {
        style: 'cursor: help;',
        title: infoText || title
    });
    label.append(b, info);
    return label;
};
const makeSelect = (type = '', _map = new Map()) => {
    const settings = getSettings();
    const selectElem = make('select', `${MODULE_NAME} text_pole margin-bot-5px`, {
        dataset: {
            type
        }
    });
    if (type in settings) {
        for (const [k, v] of _map.entries()) {
            const o = make('option', {
                value: k
            });
            if (typeof v === 'string') {
                o.title = v;
                o.textContent = v;
            } else if (Array.isArray(v)) {
                o.title = v[0];
                o.textContent = v[0];
            }
            // @ts-ignore
            if (k === String(settings[type])) {
                o.selected = true;
            }
            selectElem.append(o);
        }
        ael(selectElem, 'change', (e) => {
            const target = e.target;
            if (target instanceof HTMLSelectElement) {
                const v = target.value;
                if (type === 'enabled') {
                    const val = v === 'true';
                    settings[type] = val;
                    if (!val) {
                        for (const cv of qsA('code-view-monaco')) {
                            cv.remove();
                        }
                        for (const cv of qsA('[data-monaco="valid"]')) {
                            // @ts-ignore
                            cv.style.display = 'block';
                        }
                    }
                } else {
                    // @ts-ignore
                    settings[type] = v;
                }
                SillyTavern.getContext().saveSettingsDebounced();
            }
        });
    }

    return selectElem;
};
/** @type { Map<monaco.languages.ILanguageExtensionPoint["id"], NonNullable<monaco.languages.ILanguageExtensionPoint["aliases"]>> } */
const lngMap = new Map();
async function addSettingsPanel() {
    const [, content] = makeDrawer();
    if (!content) return;
    const generalLabel = makeLabel(
        'Monaco Editor',
        'Toggle the editor.\n\nOn disable, removes all "code-view-monaco" elements & restores textareas.'
    );
    const toggleSelect = makeSelect(
        'enabled',
        new Map([
            ['true', 'Enabled'],
            ['false', 'Disabled']
        ])
    );

    const workbenchLabel = makeLabel('Playground');
    const workbenchBtn = make('button', 'menu_button flex1', {
        textContent: 'Launch',
        title: 'Test the editor.',
        dataset: { command: 'open-monaco' }
    });
    const workbenchCfg = make('button', 'menu_button flex1', {
        textContent: 'Show Options',
        dataset: { command: 'open-options' }
    });
    const themeLabel = makeLabel('Theme', 'Default editor theme.');
    const themeSelect = makeSelect(
        'theme',
        new Map([
            ['vs-dark', 'Dark'],
            ['vs', 'Light'],
            ['hc-black', 'High Contrast Dark'],
            ['hc-light', 'High Contrast Light']
        ])
    );
    const saveLabel = makeLabel(
        'Fail Safe',
        'Data loss prevention, backups are stored into here.\n\nUseful in the event of an Error, e.g., someone elses code.'
    );
    const safeBefore = make('textarea', 'monaco-playground-before', {
        id: 'monaco-demo',
        placeholder: '[BEFORE EDITOR]'
    });
    const safeAfter = make('textarea', 'monaco-playground-after', {
        id: 'monaco-demo',
        placeholder: '[AFTER EDITOR]'
    });

    if (globalThis.monaco) {
        for (const lng of globalThis.monaco.languages.getLanguages()) {
            if (lngMap.has(lng.id)) continue;
            if (isNull(lng.aliases)) continue;
            lngMap.set(lng.id, lng.aliases);
        }
    } else if (!lngMap.has('markdown')) {
        lngMap.set('markdown', ['Markdown', 'markdown']);
    }
    const lngLabel = makeLabel('Language', 'Change the editors default language');
    const lngSelect = makeSelect('language', lngMap);

    content.append(
        generalLabel,
        toggleSelect,
        lngLabel,
        lngSelect,
        themeLabel,
        themeSelect,
        workbenchLabel,
        workbenchBtn,
        workbenchCfg,
        saveLabel,
        safeBefore,
        safeAfter
    );
}

const { eventSource, eventTypes } = SillyTavern.getContext();

eventSource.on(eventTypes.APP_READY, async () => {
    await addSettingsPanel();
    ael(document.body, 'click', function (evt) {
        const target = evt.target;
        if (target == null) return;
        if (target instanceof HTMLButtonElement && target.dataset) {
            const command = target.dataset.command;
            if (!command) return;
            const settings = getSettings();
            if (!settings.enabled) return;
            if (command === 'open-monaco') {
                if (globalThis.monaco) {
                    openMonacoEditor();
                } else {
                    loadMonaco().then(() => openMonacoEditor());
                }
            } else if (command === 'open-options') {
                const opt = Object.assign(
                    {
                        _: '[Work In Progress] Changes in this editor will NOT save!',
                        _Offical_API_:
                            'https://microsoft.github.io/monaco-editor/docs.html#variables/editor_editor_api.editor.EditorOptions.html'
                    },
                    settings
                );
                // @ts-ignore
                delete opt.enabled;
                // @ts-ignore
                delete opt.preloadOnStart;
                /** @type {CodeViewMonaco} */
                // @ts-ignore
                const cv = make('code-view-monaco');
                const ctx = SillyTavern.getContext();
                const { Popup, POPUP_TYPE } = ctx;
                const popup = new Popup(cv, POPUP_TYPE.TEXT, '', {
                    wide: true,
                    large: true,
                    okButton: true,
                    cancelButton: false,
                    onClosing: async () => {
                        cv.remove();
                        return true;
                    }
                });
                const editor = cv.createEditor(
                    { value: JSON.stringify(opt, null, ' '), language: 'json' },
                    () => popup.completeAffirmative()
                );
                popup.show();
                editor.focus();
            }
            return;
        }
        /** @type {?HTMLElement} */
        const maxElem = target.closest('.editor_maximize');
        if (maxElem && getSettings().enabled) {
            const elem = qs(`[id="${maxElem.dataset.for}"]`);
            if (elem instanceof HTMLTextAreaElement) {
                if (elem.readOnly || elem.disabled) return;
                evt.preventDefault();
                evt.stopPropagation();
                if (globalThis.monaco) {
                    openMonacoEditor(elem);
                } else {
                    loadMonaco().then(() => openMonacoEditor(elem));
                }
            }
        }
        /** @type {?HTMLSpanElement} */
        const editAction = target.closest('span.prompt-manager-edit-action');
        if (editAction) {
            /** @type {*} */
            const cv = qs('code-view-monaco');
            /** @type {?HTMLTextAreaElement} */
            const textarea = qs('textarea.text_pole[id*="prompt_manager_popup_entry_form_prompt"]');
            if (cv && textarea) {
                if (textarea.readOnly || textarea.disabled) {
                    cv._editor.setValue(
                        '# Disabled\n\nThe content of this prompt is pulled from elsewhere & cannot be editied here.'
                    );
                    cv.setAttribute('style', 'height: 10em;');
                } else {
                    cv._editor.setValue(textarea.value);
                    cv.setAttribute('style', 'min-height: 200px; height: 25em;');
                }
            }
        }
        /** @type {?HTMLDivElement} */
        const cancelBtn = target.closest('.popup-button-cancel');
        if (cancelBtn) {
            /** @type {*} */
            const cv = qs('code-view-monaco');
            /** @type {?HTMLTextAreaElement} */
            const textarea = qs('textarea[data-monaco="og"]');
            if (cv && textarea) {
                if (textarea.readOnly || textarea.disabled) {
                    cv._editor.setValue(
                        '# Disabled\n\nThe content of this prompt is pulled from elsewhere & cannot be editied here.'
                    );
                } else {
                    cv._editor.setValue(textarea.value);
                }
            }
        }
        /** @type {?HTMLButtonElement} */
        const resetBtn = target.closest('button[id="restore_default_prompt"]');
        if (resetBtn) {
            /** @type {*} */
            const cv = qs('code-view-monaco');
            /** @type {?HTMLTextAreaElement} */
            const textarea = qs('textarea[data-monaco="og"]');
            if (cv && textarea && !(textarea.readOnly || textarea.disabled)) {
                setTimeout(() => {
                    cv._editor.setValue(textarea.value);
                }, 250);
            }
        }
    });
    const pmControl = qsA(
        '[id*="prompt_manager_popup"].drawer-content > [id*="prompt_manager_popup_edit"] > [class*="prompt_manager_popup_entry"]'
    );
    for (const elem of pmControl) {
        if (qs(`[data-insertedBy="${MODULE_NAME}"]`, elem)) continue;
        /** @type {?HTMLTextAreaElement} */
        const textarea = qs('textarea.text_pole', elem);
        if (!textarea) continue;
        const tmpBtn = make('button', 'menu_button flex1', {
            textContent: 'Monaco',
            style: 'margin: 0px;',
            dataset: {
                insertedBy: MODULE_NAME
            }
        });
        ael(tmpBtn, 'click', () => {
            if (textarea.disabled || textarea.readOnly || !textarea.parentElement) return;
            if (qs('code-view-monaco', elem)) {
                /** @type {*} */
                const cv = qs('code-view-monaco', elem);
                textarea.style.display = 'block';
                textarea.value = cv._editor.getValue();
                textarea.dispatchEvent(new Event('blur'));
                cv.remove();
                return;
            }
            if (!getSettings().enabled) return;
            /** @type {CodeViewMonaco} */
            // @ts-ignore
            const cv = make('code-view-monaco', 'text_pole', {
                style: 'min-height: 200px; height: 25em;'
            });
            textarea.dataset.monaco = 'valid';
            textarea.style.display = 'none';
            textarea.parentElement.appendChild(cv);
            cv.textElement = textarea;
            const _save = function () {
                textarea.style.display = 'block';
                textarea.value = editor.getValue();
                textarea.dispatchEvent(new Event('blur'));
                cv.remove();
                setTimeout(() => {
                    /** @type {?HTMLAnchorElement} */
                    const saveBtn = qs('a.fa-save', elem);
                    if (saveBtn) saveBtn.click();
                }, 250);
            };
            const editor = cv.createEditor({ value: textarea.value }, _save);

            editor.onDidBlurEditorText(function () {
                textarea.value = editor.getValue();
                textarea.dispatchEvent(new Event('blur'));
            });

            editor.focus();
        });
        elem.prepend(tmpBtn);
    }

    observe(document, (mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.parentElement === null) continue;
                if (!(node instanceof HTMLElement)) continue;
                if (node.classList.contains('popup')) {
                    /** @type {?HTMLDivElement} */
                    const controls = qs('.popup-controls', node);
                    if (controls && getSettings().enabled) {
                        /** @type {NodeListOf<HTMLTextAreaElement>} */
                        const textareas = qsA('textarea:not([class*="popup-input"])', node);
                        for (const textarea of textareas) {
                            if (textarea.disabled || textarea.readOnly) {
                                continue;
                            } else if (textarea.id.includes('custom_')) {
                                textarea.dataset.monaco = 'valid';
                            } else if (isEmpty(textarea.value)) {
                                continue;
                            } else {
                                textarea.dataset.monaco = 'valid';
                            }
                            // con.log(textarea);
                        }

                        /** @type {NodeListOf<HTMLTextAreaElement>} */
                        const tareas = qsA('[data-monaco="valid"]', node);
                        if (!isEmpty(tareas)) {
                            const tmpBtn = make('button', 'menu_button flex1', {
                                textContent: 'Monaco',
                                style: 'margin: 0px;',
                                dataset: {
                                    insertedBy: MODULE_NAME
                                }
                            });

                            ael(tmpBtn, 'click', () => {
                                /**
                                 * @type {function[]}
                                 */
                                const fnArr = [];
                                const saveEditors = function () {
                                    for (const fn of fnArr) fn();
                                    setTimeout(() => {
                                        /** @type {?HTMLDivElement} */
                                        const saveBtn = qs('.popup-button-ok', node);
                                        if (saveBtn) saveBtn.click();
                                    }, 250);
                                };
                                for (const textarea of tareas) {
                                    if (textarea.disabled || textarea.readOnly) continue;

                                    if (
                                        textarea.parentElement &&
                                        qs('code-view-monaco', textarea.parentElement)
                                    ) {
                                        /** @type {*} */
                                        const cv = qs('code-view-monaco', textarea.parentElement);
                                        const editor = cv._editor;
                                        /** @type {?HTMLPreElement} */
                                        let ms = null;

                                        if (textarea.parentElement) {
                                            ms = qs(
                                                '[id="qr--modal-messageSyntax"]',
                                                textarea.parentElement
                                            );
                                        }
                                        if (ms) {
                                            ms.style.display = 'block';
                                            const code = qs('code', ms);
                                            if (code) {
                                                code.textContent = editor.getValue();
                                            }
                                        }
                                        textarea.style.display = 'block';
                                        textarea.value = editor.getValue();
                                        textarea.dispatchEvent(new Event('blur'));
                                        textarea.dispatchEvent(new Event('input'));
                                        cv.remove();
                                        return;
                                    }
                                    /** @type {CodeViewMonaco} */
                                    // @ts-ignore
                                    const cv = make('code-view-monaco');
                                    if (
                                        textarea.classList.contains('regex_replace_string') ||
                                        textarea.id.includes('custom_')
                                    ) {
                                        cv.setAttribute('style', 'display: block; height: 5em;');
                                    }
                                    if (textarea.id.includes('custom_')) {
                                        cv.dataset.language = 'yaml';
                                    }
                                    /** @type {?HTMLPreElement} */
                                    let ms = null;
                                    fnArr.push(() => {
                                        if (ms) {
                                            ms.style.display = 'block';
                                            const code = qs('code', ms);
                                            if (code) {
                                                code.textContent = editor.getValue();
                                            }
                                        }
                                        textarea.style.display = 'block';
                                        textarea.value = editor.getValue();
                                        textarea.dispatchEvent(new Event('blur'));
                                        textarea.dispatchEvent(new Event('input'));
                                        cv.remove();
                                    });

                                    if (textarea.parentElement) {
                                        ms = qs(
                                            '[id="qr--modal-messageSyntax"]',
                                            textarea.parentElement
                                        );
                                        textarea.parentElement.appendChild(cv);
                                        cv.textElement = textarea;
                                    }
                                    if (ms) {
                                        ms.style.display = 'none';
                                    }

                                    textarea.style.display = 'none';

                                    const editor = cv.createEditor(
                                        { value: textarea.value },
                                        saveEditors
                                    );

                                    editor.onDidBlurEditorText(function () {
                                        textarea.value = editor.getValue();
                                        textarea.dispatchEvent(new Event('blur'));
                                        textarea.dispatchEvent(new Event('input'));
                                    });
                                }
                            });

                            controls.prepend(tmpBtn);
                        }
                    }
                }
            }
        }
    });
});
