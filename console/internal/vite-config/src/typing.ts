import type { Options as HtmlMinifierOptions } from 'html-minifier-terser';
import type { PluginVisualizerOptions } from 'rollup-plugin-visualizer';
import type { PluginOptions } from 'unplugin-dts';
import type {
  ConfigEnv,
  PluginOption,
  UserConfig,
  UserConfigFnPromise,
} from 'vite';
import type { Options as PwaPluginOptions } from 'vite-plugin-pwa';

/**
 * ImportMap configuration interface
 * @description Configure module import maps with support for custom import paths and scopes
 * @example
 * ```typescript
 * {
 *   imports: {
 *     'vue': 'https://unpkg.com/vue@3.2.47/dist/vue.esm-browser.js'
 *   },
 *   scopes: {
 *     'https://site.com/': {
 *       'vue': 'https://unpkg.com/vue@3.2.47/dist/vue.esm-browser.js'
 *     }
 *   }
 * }
 * ```
 */
interface IImportMap {
  /** Module import map */
  imports?: Record<string, string>;
  /** Scope-specific import map */
  scopes?: {
    [scope: string]: Record<string, string>;
  };
}

/**
 * Print plugin configuration options
 * @description Configure console print output
 */
interface PrintPluginOptions {
  /**
   * Data map to print
   * @description Key-value data to print in console
   * @example
   * ```typescript
   * {
   *   'App Version': '1.0.0',
   *   'Build Time': '2024-01-01'
   * }
   * ```
   */
  infoMap?: Record<string, string | undefined>;
}

/**
 * Nitro Mock plugin configuration options
 * @description Configure Nitro Mock server behavior
 */
interface NitroMockPluginOptions {
  /**
   * Mock server package name
   * @default '@vbenjs/nitro-mock'
   */
  mockServerPackage?: string;

  /**
   * Mock server port
   * @default 3000
   */
  port?: number;

  /**
   * Whether to print mock logs
   * @default false
   */
  verbose?: boolean;
}

/**
 * Archiver plugin configuration options
 * @description Configure build artifact compression and archiving
 */
interface ArchiverPluginOptions {
  /**
   * Output filename
   * @default 'dist'
   */
  name?: string;
  /**
   * Output directory
   * @default '.'
   */
  outputDir?: string;
}

/**
 * HTML plugin configuration
 * @description Configure HTML minification behavior based on transformIndexHtml
 */
type HtmlPluginOptions = HtmlMinifierOptions;

/**
 * ImportMap plugin configuration
 * @description Configure CDN module imports
 */
interface ImportmapPluginOptions {
  /**
   * CDN provider
   * @default 'jspm.io'
   * @description Supports esm.sh and jspm.io CDN providers
   */
  defaultProvider?: 'esm.sh' | 'jspm.io';
  /**
   * ImportMap configuration array
   * @description Configure packages to import from CDN
   * @example
   * ```typescript
   * [
   *   { name: 'vue' },
   *   { name: 'pinia', range: '^2.0.0' }
   * ]
   * ```
   */
  importmap?: Array<{ name: string; range?: string }>;
  /**
   * Manual ImportMap configuration
   * @description Custom ImportMap configuration
   */
  inputMap?: IImportMap;
}

/**
 * Conditional plugin configuration
 * @description Dynamically load plugins based on conditions
 */
interface ConditionPlugin {
  /**
   * Condition
   * @description Load plugin when condition is true
   */
  condition?: boolean;
  /**
   * Plugin object
   * @description Returns plugin array or Promise
   */
  plugins: () => PluginOption[] | PromiseLike<PluginOption[]>;
}

/**
 * Common plugin configuration options
 * @description Shared base configuration for all plugins
 */
interface CommonPluginOptions {
  /**
   * Whether to enable devtools
   * @default false
   */
  devtools?: boolean;
  /**
   * Environment variables
   * @description Custom environment variables
   */
  env?: Record<string, any>;
  /**
   * Whether to inject metadata
   * @default true
   */
  injectMetadata?: boolean;
  /**
   * Whether build mode is active
   * @default false
   */
  isBuild?: boolean;
  /**
   * Build mode
   * @default 'development'
   */
  mode?: string;
  /**
   * Whether to enable dependency analysis
   * @default false
   * @description Analyze dependencies using rollup-plugin-visualizer
   */
  visualizer?: boolean | PluginVisualizerOptions;
}

/**
 * Application plugin configuration options
 * @description Configure plugin options for application builds
 */
interface ApplicationPluginOptions extends CommonPluginOptions {
  /**
   * Whether to enable archive compression
   * @default false
   * @description When enabled, generates a zip file in the output directory
   */
  archiver?: boolean;
  /**
   * Archiver plugin configuration
   * @description Configure compression and archiving behavior
   */
  archiverPluginOptions?: ArchiverPluginOptions;
  /**
   * Whether to enable compression
   * @default false
   * @description Supports gzip and brotli compression
   */
  compress?: boolean;
  /**
   * Compression type
   * @default ['gzip']
   * @description Optional compression types
   */
  compressTypes?: ('brotli' | 'gzip')[];
  /**
   * Whether to enable dayjs plugin
   * @default true
   */
  dayjs?: boolean;
  /**
   * Whether to extract config file
   * @default false
   * @description Extract configuration file at build time
   */
  extraAppConfig?: boolean;
  /**
   * Whether to enable HTML plugin
   * @default true
   */
  html?: boolean | HtmlPluginOptions;
  /**
   * Whether to enable i18n
   * @default false
   */
  i18n?: boolean;
  /**
   * Whether to enable ImportMap CDN
   * @default false
   */
  importmap?: boolean;
  /**
   * ImportMap plugin configuration
   */
  importmapOptions?: ImportmapPluginOptions;
  /**
   * Whether to inject application loading animation
   * @default true
   */
  injectAppLoading?: boolean;
  /**
   * Whether to inject global SCSS
   * @default true
   */
  injectGlobalScss?: boolean;
  /**
   * Whether to inject license / copyright information
   * @default true
   */
  license?: boolean;
  /**
   * Whether to enable Nitro Mock
   * @default false
   */
  nitroMock?: boolean;
  /**
   * Nitro Mock plugin configuration
   */
  nitroMockOptions?: NitroMockPluginOptions;
  /**
   * Whether to enable console print output
   * @default false
   */
  print?: boolean;
  /**
   * Print plugin configuration
   */
  printInfoMap?: PrintPluginOptions['infoMap'];
  /**
   * Whether to enable PWA
   * @default false
   */
  pwa?: boolean;
  /**
   * PWA plugin configuration
   */
  pwaOptions?: Partial<PwaPluginOptions>;
  /**
   * Whether to enable VXE Table lazy loading
   * @default false
   */
  vxeTableLazyImport?: boolean;
}

/**
 * Library plugin configuration options
 * @description Configure plugin options for library builds
 */
interface LibraryPluginOptions extends CommonPluginOptions {
  /**
   * Whether to enable DTS output
   * @default true
   * @description Generate TypeScript declaration files
   */
  dts?: boolean | PluginOptions;
}

/**
 * Application configuration options type
 */
type ApplicationOptions = ApplicationPluginOptions;

/**
 * Library configuration options type
 */
type LibraryOptions = LibraryPluginOptions;

/**
 * Application configuration definition function type
 * @description Define application build configuration
 */
type DefineApplicationOptions = (config?: ConfigEnv) => Promise<{
  /** Application plugin configuration */
  application?: ApplicationOptions;
  /** Vite configuration */
  vite?: UserConfig;
}>;

/**
 * Library configuration definition function type
 * @description Define library build configuration
 */
type DefineLibraryOptions = (config?: ConfigEnv) => Promise<{
  /** Library plugin configuration */
  library?: LibraryOptions;
  /** Vite configuration */
  vite?: UserConfig;
}>;

/**
 * Configuration definition type
 * @description Configuration definition for application or library
 */
type DefineConfig = DefineApplicationOptions | DefineLibraryOptions;

type VbenViteConfig = Promise<UserConfig> | UserConfig | UserConfigFnPromise;

export type {
  ApplicationPluginOptions,
  ArchiverPluginOptions,
  CommonPluginOptions,
  ConditionPlugin,
  DefineApplicationOptions,
  DefineConfig,
  DefineLibraryOptions,
  HtmlPluginOptions,
  IImportMap,
  ImportmapPluginOptions,
  LibraryPluginOptions,
  NitroMockPluginOptions,
  PrintPluginOptions,
  VbenViteConfig,
};
