declare namespace stextension {
    /**
     * Returns the first element that is a descendant of node that matches selectors.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/querySelector)
     */
    export function qs<K extends keyof HTMLElementTagNameMap>(
        selectors: K,
        root?: ParentNode
    ): HTMLElementTagNameMap[K] | null;
    export function qs<K extends keyof SVGElementTagNameMap>(
        selectors: K,
        root?: ParentNode
    ): SVGElementTagNameMap[K] | null;
    export function qs<K extends keyof MathMLElementTagNameMap>(
        selectors: K,
        root?: ParentNode
    ): MathMLElementTagNameMap[K] | null;
    export function qs<E extends Element = Element>(selectors: string, root?: ParentNode): E | null;

    /**
     * Returns all element descendants of node that match selectors.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/querySelectorAll)
     */
    export function qsA<K extends keyof HTMLElementTagNameMap>(
        selectors: K,
        root?: ParentNode
    ): NodeListOf<HTMLElementTagNameMap[K]>;
    export function qsA<K extends keyof SVGElementTagNameMap>(
        selectors: K,
        root?: ParentNode
    ): NodeListOf<SVGElementTagNameMap[K]>;
    export function qsA<K extends keyof MathMLElementTagNameMap>(
        selectors: K,
        root?: ParentNode
    ): NodeListOf<MathMLElementTagNameMap[K]>;
    export function qsA<E extends Element = Element>(
        selectors: string,
        root?: ParentNode
    ): NodeListOf<E>;

    /**
     * Creates an instance of the element for the specified tag.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Document/createElement)
     * @param tagName - The name of an element.
     * @param cname - A className for the element.
     * @param attrs - Set attributes for the element.
     * @see {@link document.createElement}
     */
    export function make<T extends keyof HTMLElementTagNameMap>(
        tagName: T,
        cname?: any,
        attrs?: any
    ): HTMLElementTagNameMap[T];
    export function make(tagName: string, cname?: any, attrs?: any): HTMLElement;
}
