import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendPriceChangeEmail(
        oldPrice: number,
        newPrice: number,
        currency: any,
        ticketUid: string,
        ticketId: string,
    ) {
        const baseUrl = 'https://agimtours-five.vercel.app';
        const directLink = `${baseUrl}/plane-tickets/${ticketId}`;

        const mailOptions = {
            from: `"Agim Tours" <${this.configService.get<string>('SMTP_USER')}>`,
            to: 'besir.dauti@outlook.com',
            subject: `Njoftim: Ndryshim i çmimit për biletën ${ticketUid}`,
            html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Përshëndetje Etnik,</h2>
          <p>Çmimi i biletës me UID <strong>${ticketUid}</strong> ka ndryshuar.</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Çmimi i mëparshëm:</strong> ${oldPrice} ${currency}</li>
            <li><strong>Çmimi i ri:</strong> ${newPrice} ${currency}</li>
          </ul>
          <p>Ju mund ta shikoni biletën drejtpërdrejt duke klikuar në linkun e mëposhtëm:</p>
          <div style="margin: 20px 0;">
            <a href="${directLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Shiko Biletën</a>
          </div>
          <p>Faleminderit,<br>Sistemi Agim Tours</p>
        </div>
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}
