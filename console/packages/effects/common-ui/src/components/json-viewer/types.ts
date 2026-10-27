export interface JsonViewerProps {
  /** Structured data to display */
  value: any;
  /** Expand depth */
  expandDepth?: number;
  /** Whether copy is enabled */
  copyable?: boolean;
  /** Whether to sort keys */
  sort?: boolean;
  /** Show border */
  boxed?: boolean;
  /** Theme */
  theme?: string;
  /** Whether expanded */
  expanded?: boolean;
  /** Date formatting function */
  timeformat?: (time: Date | number | string) => string;
  /** Preview mode */
  previewMode?: boolean;
  /** Display array indices */
  showArrayIndex?: boolean;
  /** Display double quotes */
  showDoubleQuotes?: boolean;
}

export interface JsonViewerAction {
  action: string;
  text: string;
  trigger: HTMLElement;
}

export interface JsonViewerValue {
  value: any;
  path: string;
  depth: number;
  el: HTMLElement;
}

export interface JsonViewerToggle {
  /** Mouse events */
  event: MouseEvent;
  /** Current expanded state */
  open: boolean;
}
