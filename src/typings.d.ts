/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

// https://github.com/zlepper/typescript-webworker
declare module 'file-loader?name=[name].js!*' {
  const value: string;
  export = value;
}