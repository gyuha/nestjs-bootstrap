import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { EnvService } from "../../../config/env.service";
import type { EmailOptions, EmailServiceInterface } from "./email-service.interface";

@Injectable()
export class SmtpEmailService implements EmailServiceInterface {
  private transporter: nodemailer.Transporter;

  constructor(private readonly env: EnvService) {
    this.transporter = nodemailer.createTransport({
      host: this.env.get("SMTP_HOST"),
      port: parseInt(this.env.get("SMTP_PORT") || "587", 10),
      secure: false,
      auth: {
        user: this.env.get("SMTP_USER"),
        pass: this.env.get("SMTP_PASS"),
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.env.get("EMAIL_FROM"),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}