declare module "mailparser" {
  export function simpleParser(
    source: Buffer | Uint8Array | string
  ): Promise<{
    subject?: string;
    from?: { text?: string } | null;
    text?: string;
    date?: Date;
  }>;
}
