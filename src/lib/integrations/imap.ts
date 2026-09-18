import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export type ImapCredential = {
  email: string;
  host: string;
  port: number;
  pass?: string;
  accessToken?: string;
};

export type NormalizedEmail = {
  externalId: string;
  subject: string;
  sender: string;
  body: string;
  occurredAt: string;
};

export async function fetchRecentImapMessages(
  credential: ImapCredential,
  since: Date
): Promise<NormalizedEmail[]> {
  const client = new ImapFlow({
    host: credential.host,
    port: credential.port,
    secure: true,
    auth: {
      user: credential.email,
      ...(credential.accessToken
        ? { accessToken: credential.accessToken }
        : { pass: credential.pass || "" }),
    },
    logger: false,
  });

  await client.connect();

  try {
    const lock = await client.getMailboxLock("INBOX");

    try {
      const uids = await client.search({ since }, { uid: true });
      const recent = Array.isArray(uids) ? uids.slice(-30) : [];

      const messages: NormalizedEmail[] = [];

      if (!recent.length) return messages;

      for await (const message of client.fetch(
        recent,
        {
          uid: true,
          envelope: true,
          source: true,
        },
        { uid: true }
      )) {
        const parsed = await simpleParser(message.source);

        messages.push({
          externalId: String(message.uid),
          subject: parsed.subject || message.envelope?.subject || "",
          sender:
            parsed.from?.text ||
            message.envelope?.from
              ?.map((item) => item.address || item.name || "")
              .filter(Boolean)
              .join(", ") ||
            "",
          body: parsed.text || "",
          occurredAt:
            parsed.date?.toISOString() ||
            message.envelope?.date?.toISOString() ||
            new Date().toISOString(),
        });
      }

      return messages;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
}
