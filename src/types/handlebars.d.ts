declare module '*.hbs' {
  const template: string;
  export default template;
}

declare module '*.hbs?raw' {
  const template: string;
  export default template;
}

declare module 'vite-plugin-handlebars' {
  import type { Plugin } from 'vite';
  interface HandlebarsOptions {
    partialDirectory?: string | string[];
    helpers?: Record<string, (...args: unknown[]) => unknown>;
    context?: Record<string, unknown> | ((pagePath: string) => Record<string, unknown>);
  }
  export default function handlebars(options?: HandlebarsOptions): Plugin;
}
