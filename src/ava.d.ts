declare module "@antv/ava/browser" {
  export class AVA {
    constructor(config: any);
    source(config: any): Promise<void>;
    schema(): Promise<any>;
    semantic(options: any, setter: () => any): Promise<any>;
    query(sql: string): Promise<any>;
    dispose(): Promise<void>;
  }
  export function registerEngine(name: string, engine: any): void;
}
