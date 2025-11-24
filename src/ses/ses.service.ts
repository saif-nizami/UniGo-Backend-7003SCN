import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class SesService {
  private sesClient: SESClient;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS SES environment variables are missing!');
    }

    this.sesClient = new SESClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    from: string = process.env.SES_VERIFIED_EMAIL!,
  ): Promise<any> {
    try {
      const command = new SendEmailCommand({
        Destination: { ToAddresses: [to] },
        Message: {
          Body: { Text: { Charset: 'UTF-8', Data: body } },
          Subject: { Charset: 'UTF-8', Data: subject },
        },
        Source: from,
      });

      return await this.sesClient.send(command);
    } catch (err) {
      console.error('SES send email error', err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
