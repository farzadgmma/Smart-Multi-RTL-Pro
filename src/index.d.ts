/**
 * TypeScript Definitions for @mobtakerai/rtl-pro
 */

export type RtlMode = 'auto' | 'rtl' | 'ltr' | 'manual';

export type RtlFont =
  | 'vazir'
  | 'yekan'
  | 'estedad'
  | 'dana'
  | 'shabnam'
  | 'tanha'
  | 'gandom'
  | 'nahid'
  | 'samim'
  | 'sahel'
  | 'parastoo'
  | 'notosans'
  | 'nazanin'
  | 'mitra'
  | 'yagut'
  | 'system'
  | string;

export type RtlFontSize = '100' | '110' | '120' | '130' | string;
export type RtlLineHeight = 'normal' | 'relaxed' | 'loose' | string;

export interface RtlOptions {
  /**
   * The root element or CSS selector to monitor and apply RTL logic to.
   * @default document.body
   */
  target?: HTMLElement | string;

  /**
   * Alignment mode strategy.
   * - 'auto': Detects Persian/Arabic and applies RTL; preserves pure English as LTR.
   * - 'rtl': Forces all text blocks to RTL.
   * - 'ltr': Forces all text blocks to LTR.
   * - 'manual': Only processes elements explicitly triggered by the user.
   * @default 'auto'
   */
  mode?: RtlMode;

  /**
   * Persian font family name or 'system' for native website typography.
   * @default 'vazir'
   */
  font?: RtlFont;

  /**
   * Font size scaling percentage.
   * @default '100'
   */
  fontSize?: RtlFontSize;

  /**
   * Line height preset for improved Persian readability.
   * @default 'normal'
   */
  lineHeight?: RtlLineHeight;

  /**
   * Automatically convert English digits (123) to Persian digits (۱۲۳).
   * @default false
   */
  convertNumbers?: boolean;

  /**
   * Explicitly protect `<pre>`, `<code>`, Monaco, Prism, and Highlight.js blocks from RTL alteration.
   * @default true
   */
  preserveCode?: boolean;

  /**
   * Automatically inject default zero-latency CSS styles into document.head.
   * @default true
   */
  injectStyles?: boolean;

  /**
   * Streaming batch throttle delay in milliseconds.
   * @default 60
   */
  throttleMs?: number;

  /**
   * Additional CSS selectors to exclude from direction processing.
   * @default []
   */
  excludeSelectors?: string[];
}

export interface RtlController {
  /**
   * Manually trigger a full scan on the target or a specific container.
   */
  scan: (customRoot?: HTMLElement) => void;

  /**
   * Change the alignment mode at runtime.
   */
  setMode: (newMode: RtlMode) => void;

  /**
   * Change the font family preset at runtime.
   */
  setFont: (newFont: RtlFont) => void;

  /**
   * Update configuration options dynamically.
   */
  setOptions: (newOpts: Partial<RtlOptions>) => void;

  /**
   * Pause the MutationObserver.
   */
  disconnect: () => void;

  /**
   * Completely destroy observers, listeners, and pending tasks.
   */
  destroy: () => void;
}

/**
 * Initializes the Smart Multi-RTL Pro engine on a page or element.
 */
export function initRtl(options?: RtlOptions): RtlController;

/**
 * Detects whether a string contains Persian or Arabic characters.
 */
export function isPersianArabicText(text: string | null | undefined): boolean;

/**
 * Detects whether a string is purely English/Latin without Persian/Arabic characters.
 */
export function isPureEnglishText(text: string | null | undefined): boolean;

/**
 * Converts Latin digits in a string to Persian digits (e.g. "123" -> "۱۲۳").
 */
export function convertDigitsToPersian(text: string): string;

/**
 * Checks whether an element is inside a code block, Monaco editor, or code input.
 */
export function isCodeOrEditorArea(el: HTMLElement | null | undefined): boolean;

/**
 * Checks whether an element is an editable root (input, textarea, contenteditable).
 */
export function isEditableRoot(el: HTMLElement | null | undefined): boolean;

/**
 * Injects default CSS rules into document.head.
 */
export function injectStyles(customCss?: string): void;

/**
 * Removes injected CSS rules from document.head.
 */
export function removeInjectedStyles(): void;

/**
 * Explicitly sets an element to RTL direction with isolation styles.
 */
export function setRtl(el: HTMLElement, config?: Partial<RtlOptions>): void;

/**
 * Explicitly sets an element to LTR direction.
 */
export function setLtr(el: HTMLElement): void;

/**
 * Clears custom direction attributes and classes from an element.
 */
export function clearDirection(el: HTMLElement): void;

/**
 * Processes a single element according to RTL configuration.
 */
export function processElement(el: HTMLElement, config?: Partial<RtlOptions>): void;

/**
 * Scans a DOM subtree using native C++ TreeWalker.
 */
export function scanNodeTree(root: HTMLElement, config?: Partial<RtlOptions>): void;

export default initRtl;
