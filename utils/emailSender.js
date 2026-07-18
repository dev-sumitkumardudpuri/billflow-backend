import nodemailer from "nodemailer";

export const sendInvoiceEmail = async (
  clientEmail,
  clientName,
  userName,
  businessName,
  invoiceNumber,
  pdfBuffer,
) => {
  const dynamicReplyTo = `no-reply@${businessName ? businessName.toLowerCase().replace(/\s+/g, "") : "billflow"}.com`;

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com", // Brevo SMTP Host
    port: 587, // Port
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_API_KEY,
    },
  });

  const mailOptions = {
    from: `"${businessName || userName || "BillFlow System"}" <${process.env.REAL_GMAIL}>`,
    to: `${clientName} <${clientEmail}>`,
    replyTo: dynamicReplyTo,
    subject: `Invoice ${invoiceNumber} from ${businessName || userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Hello ${clientName},</h2>
        <p>We hope this email finds you well.</p>
        <p>Please find attached invoice <strong>${invoiceNumber}</strong>. Kindly review the attached PDF document for details.</p>
        <br>
        <p>Thank you for your business!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.9em; color: #7f8c8d;">Best Regards,<br><strong>${userName}</strong><br>${businessName || ""}</p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      "Email sent successfully via Brevo SMTP! MessageId:",
      info.messageId,
    );
  } catch (error) {
    console.error("Nodemailer/Brevo SMTP Email Error:", error.message);
    throw new Error("Failed to send email to client");
  }
};
