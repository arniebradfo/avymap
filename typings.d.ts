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

// https://hackernoon.com/import-json-into-typescript-8d465beded79
declare module "*.json" {
  const value: any;
  export default value;
}

// https://github.com/smooth-code/svgr/issues/38
interface SvgComponent extends React.StatelessComponent<React.SVGAttributes<SVGElement>> {}
declare module '*.svg' {
    const value: SvgComponent;
    export default value;
}
