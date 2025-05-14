declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
      error?: Error;
    }>;
  }

  interface Input {
    arrayBuffer?: ArrayBuffer;
    path?: string;
    buffer?: Buffer;
  }

  interface Options {
    styleMap?: string;
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
    ignoreEmptyParagraphs?: boolean;
    convertImage?: (image: any) => any;
    idPrefix?: string;
  }

  interface Images {
    inline: (conversion: any) => any;
    dataUri: (conversion: any) => any;
  }

  interface Mammoth {
    convertToHtml: (input: Input, options?: Options) => Promise<MammothResult>;
    convertToMarkdown: (input: Input, options?: Options) => Promise<MammothResult>;
    extractRawText: (input: Input) => Promise<MammothResult>;
    embedStyleMap: (input: Input, styleMap: string) => Promise<{
      toArrayBuffer: () => ArrayBuffer;
      toBuffer: () => Buffer;
    }>;
    images: Images;
  }

  const mammoth: Mammoth;
  export = mammoth;
} 