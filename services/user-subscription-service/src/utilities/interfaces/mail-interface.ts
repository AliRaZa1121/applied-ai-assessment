export interface SendMailMessageInterface {
  email: string;
  subject: string;
  body: string;
  name: string;
  link?: string;
  linkText?: string;
  cc?: string | Array<string>;
  bcc?: string | Array<string>;
  attachments?: {
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
    cid?: string;
    encoding?: string;
    contentDisposition?: 'attachment' | 'inline' | undefined;
    href?: string;
  }[];
}
