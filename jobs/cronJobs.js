import cron from "node-cron";
import Invoice from "../models/Invoice.js";
import User from "../models/User.js";
import Client from "../models/Client.js";
import nodemailer from "nodemailer";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";

export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily automated cron job to check due invoices...");

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const dueInvoices = await Invoice.find({
        status: "Unpaid",
        dueDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      });

      console.log(`Found ${dueInvoices.length} invoices due exactly today.`);

      for (const invoice of dueInvoices) {
        const user = await User.findById(invoice.userId);
        const client = await Client.findById(invoice.clientId);

        if (user && client) {
          try {
            const pdfBuffer = await generateInvoicePDF(invoice, user, client);
            await sendReminderEmail(
              client.email,
              client.clientName,
              user.name,
              user.companyDetails?.businessName,
              invoice.invoiceNumber,
              pdfBuffer,
            );
            console.log(
              `Final due date reminder email sent successfully to ${client.clientName} for Invoice ${invoice.invoiceNumber}`,
            );
          } catch (emailError) {
            console.error(
              `Failed to send reminder for invoice ${invoice.invoiceNumber}:`,
              emailError.message,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error in running cron job:", error.message);
    }
  });
};

const sendReminderEmail = async (
  clientEmail,
  clientName,
  userName,
  businessName,
  invoiceNumber,
  pdfBuffer,
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${businessName || userName}" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `Friendly Payment Reminder: Invoice ${invoiceNumber} is due today`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f39c12; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d35400; margin-bottom: 20px;">Payment Reminder Notice</h2>
        <p>Hello ${clientName},</p>
        <p>This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is due today.</p>
        <p>We kindly request you to review the attached invoice PDF and process the payment as per the bank details provided at the bottom of the document.</p>
        <p>If you have already processed the payment, please disregard this email.</p>
        <br>
        <p>Thank you for your cooperation and prompt attention to this matter.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.9em; color: #7f8c8d;">Best Regards,<br><strong>${userName}</strong><br>${businessName || ""}</p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};
