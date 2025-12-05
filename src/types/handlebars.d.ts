declare module '*.hbs' {
  const template: string;
  export default template;
}

declare module '*.hbs?raw' {
  const template: string;
  export default template;
}
