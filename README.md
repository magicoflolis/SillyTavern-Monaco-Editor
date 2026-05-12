<h1 align="center">
<sub>
</sub>
Monaco Editor for SillyTavern
</h1>

_Expand text editing in SillyTavern with the [Monaco Editor](https://microsoft.github.io/monaco-editor/)._

---

This extension loads the [Monaco Editor](https://github.com/microsoft/monaco-editor) into the page and overrides any "_Expand text area_" buttons with its own popup window.

The Monaco Editor is the code editor that powers [VS Code](https://github.com/microsoft/vscode). **Monaco has no mobile browser support!**

_May work on FireFox, e.g., FireFox nightly mobile._

## Install

> [Third party extensions](https://docs.sillytavern.app/extensions/#third-party-extensions)

```txt
https://github.com/magicoflolis/SillyTavern-Monaco-Editor
```

## Previews

<p>
  <img src="https://raw.githubusercontent.com/magicoflolis/SillyTavern-Monaco-Editor/master/assets/example_1.gif">
  <img src="https://raw.githubusercontent.com/magicoflolis/SillyTavern-Monaco-Editor/master/assets/example_2.gif">
</p>

## Editor API

> See [Monaco Editor API](https://microsoft.github.io/monaco-editor/docs.html)

The `monaco` object is **global**, `globalThis.monaco`.

```js
if (typeof globalThis.monaco !== 'undefined') {
    // Do work
}
```

### Custom Element

This extension registers its own custom element, `document.createElement("code-view-monaco")`, into SillyTavern.

```ts
class CodeViewMonaco extends HTMLElement {
    _: HTMLDivElement; // The container for the editor
    _editor: monaco.editor.IStandaloneCodeEditor | undefined; // The Monaco editor
    _textElement: HTMLTextAreaElement | null; // (Optional) bind to a TextAreaElement
    textElement: null; // getter & setter for `this._textElement`
    createEditor(
        options?: monaco.editor.IStandaloneEditorConstructionOptions,
        shortcutFN?: monaco.editor.ICommandHandler
    ): monaco.editor.IStandaloneCodeEditor;
}
```

---

**Examples:**

> Basic usage

```js
// Recommend using `openMonacoEditor()` instead!

const cv = document.createElement('code-view-monaco');

document.body.prepend(cv);

// (Optional) Validate if `CodeViewMonaco.createEditor()` exists
//if (typeof cv.createEditor === "function") {
//const editor = cv.createEditor();
// ...
//}

const editor = cv.createEditor();

// Returns => Monaco Editor
console.log(editor);

// Remove custom element & call `editor.dispose()`
// cv.remove();

// Update the editor value
// editor.setValue("Hello World!");
```

> Custom options and save function

```js
const cv = document.createElement('code-view-monaco');

document.body.prepend(cv);

// EditorOptions
const options = {
    // Disable the minimap
    minimap: {
        enabled: false
    }
};

// Keyboard shortcut: Ctrl+S / Cmd+S
const shortcutFN = () => {
    alert('Shortcut funtion executed!');
};

const editor = cv.createEditor(options, shortcutFN);

// Returns => Monaco Editor
console.log(editor);

// When focus away from editor
editor.onDidBlurEditorText(shortcutFN);
```

> Bind to an existing textarea element

```js
function monacoExample() {
    const textarea = document.getElementById('monaco-demo');

    textarea.value = '{"thinking": {"type": "enabled"}}';

    const cv = document.createElement('code-view-monaco');

    // (Optional) override editor language
    cv.dataset.language = 'yaml';

    // Bind `textarea`
    cv.textElement = textarea;

    // EditorOptions
    const options = {
        value: textarea.value
    };

    const onEditorBlur = () => {
        textarea.value = editor.getValue();
        // If `textarea` has blur event listener
        textarea.dispatchEvent(new Event('blur'));
        // If `textarea` has input event listener
        textarea.dispatchEvent(new Event('input'));
    };

    // Keyboard shortcut: Ctrl+S / Cmd+S → save and close
    const shortcutFN = () => {
        onEditorBlur(); // trigger save
        cv.remove();
    };

    // SillyTavern Popup
    const { Popup, POPUP_TYPE, POPUP_RESULT } = SillyTavern.getContext();
    const popup = new Popup(cv, POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        onClosing: async () => {
            if (popup.result === POPUP_RESULT.AFFIRMATIVE) {
                // trigger save
                onEditorBlur();
            }
            cv.remove();
            return true;
        }
    });
    popup.show();

    // Create a Monaco instance
    const editor = cv.createEditor(options, shortcutFN);

    // When focus away from editor,
    // update `textarea.value` & trigger events
    editor.onDidBlurEditorText(onEditorBlur);

    // Change focus
    editor.focus();
}

monacoExample();
```

---

### Global Function

This extension exposes its `openMonacoEditor()` function into SillyTavern.

```ts
const openMonacoEditor: (
    textarea?: HTMLTextAreaElement,
    options?: monaco.editor.IStandaloneEditorConstructionOptions
) => CodeViewMonaco;
```

---

**Examples:**

> Basic usage

```js
// (Optional) Validate if `openMonacoEditor()` exists
//if (globalThis.openMonacoEditor) {
//const cv = openMonacoEditor();
// ...
//}

// (Optional) EditorOptions
const options = {};

// Returns, "code-view-monaco", custom element
const cv = openMonacoEditor(undefined, options); // or just `openMonacoEditor()`

// Returns => CodeViewMonaco
console.log(cv);

// Returns => Monaco Editor
console.log(cv._editor);
```

> Bind to an existing textarea element

```js
const textarea = document.createElement('textarea');

textarea.value = 'Hello World!';

// (Optional) EditorOptions
const options = {};

// Returns, "code-view-monaco", custom element
const cv = openMonacoEditor(textarea, options); // or just `openMonacoEditor(textarea)`

// Returns => CodeViewMonaco
console.log(cv);

// Returns => Monaco Editor
console.log(cv._editor);

// Returns our `textarea` element
console.log(cv._textElement);
```

---

## Options

> See [EditorOptions](https://microsoft.github.io/monaco-editor/docs.html#variables/editor_editor_api.editor.EditorOptions.html)

## Customizing the Appereance

> See [Exposed Colors](https://microsoft.github.io/monaco-editor/playground.html?source=v0.55.1#example-customizing-the-appearence-exposed-colors)

## Documentation

Please navigate to [https://microsoft.github.io/monaco-editor/](https://microsoft.github.io/monaco-editor/) for additional documentation.
