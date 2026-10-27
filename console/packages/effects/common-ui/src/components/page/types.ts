export interface PageProps {
  title?: string;
  description?: string;
  contentClass?: string;
  /**
   * Auto-adapt height based on visible content height
   */
  autoContentHeight?: boolean;
  headerClass?: string;
  footerClass?: string;
  /**
   * Custom height offset value (in pixels) to adjust content area sizing
   * when used with autoContentHeight
   * @default 0
   */
  heightOffset?: number;
  /**
   * Whether the footer is anchored to the bottom of the page layout.
   * The footer remains in flow so it cannot obscure page content.
   * @default false
   */
  footerFixed?: boolean;
}
