import puppeteer from "puppeteer";
import locateChrome from "locate-chrome";

export const generateInvoicePDF = async (invoice, user, client) => {
  const selectedCurrency =
    invoice.currency || user.companyDetails?.currency || "USD";

  const currencySymbols = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
    JPY: "¥",
    CNY: "¥",
    SGD: "S$",
    AED: "AED",
  };

  const currencySymbol = currencySymbols[selectedCurrency] || "$";

  const itemRows = invoice.items
    .map(
      (item) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; text-align: left;">
              ${item.itemName}
              ${item.taxRate ? `<br><small style="color: #7f8c8d;">Tax: ${item.taxRate}%</small>` : ""}
            </td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right;">${currencySymbol}${item.price.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right; font-weight: bold;">${currencySymbol}${item.total.toFixed(2)}</td>
        </tr>
    `,
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 30px; color: #333; background-color: #fff;">
        <table style="width: 100%; line-height: inherit; text-align: left; border-collapse: collapse;">
            <tr>
                <td colspan="4" style="padding-bottom: 40px;">
                    <table style="width: 100%;">
                        <tr>
                            <td>
                                ${user.companyDetails?.logoUrl ? `<img src="${user.companyDetails.logoUrl}" style="max-width: 150px; max-height: 60px; margin-bottom: 10px;"><br>` : ""}
                                <span style="font-size: 24px; font-weight: bold; color: #2c3e50;">
                                    ${user.companyDetails?.businessName || user.name.toUpperCase()}
                                </span>
                            </td>
                            <td style="text-align: right; font-size: 24px; color: #7f8c8d; font-weight: 300; vertical-align: top;">
                                INVOICE
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            
            <tr style="vertical-align: top;">
                <td colspan="4" style="padding-bottom: 40px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 50%;">
                                <strong style="color: #2c3e50;">From:</strong><br>
                                ${user.name}<br>
                                ${user.companyDetails?.address || ""}<br>
                                ${user.email}
                                ${user.companyDetails?.taxId ? `<br><small>Tax ID: ${user.companyDetails.taxId}</small>` : ""}
                            </td>
                            <td style="text-align: right; width: 50%;">
                                <strong style="color: #2c3e50;">To:</strong><br>
                                ${client.clientName}<br>
                                ${client.companyName || ""}<br>
                                ${client.address || ""}<br>
                                ${client.email}
                                ${client.taxId ? `<br><small>Tax ID: ${client.taxId}</small>` : ""}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td colspan="4" style="background: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                    <table style="width: 100%;">
                        <tr>
                            <td><strong>Invoice No:</strong> ${invoice.invoiceNumber}</td>
                            <td><strong>Date of Issue:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</td>
                            <td style="text-align: right; color: #e74c3c;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            
            <tr style="background: #2c3e50; color: #fff; font-weight: bold;">
                <td style="padding: 12px; border-radius: 4px 0 0 4px;">Description</td>
                <td style="padding: 12px; text-align: center;">Qty</td>
                <td style="padding: 12px; text-align: right;">Unit Price</td>
                <td style="padding: 12px; text-align: right; border-radius: 0 4px 4px 0;">Amount</td>
            </tr>
            
            ${itemRows}
            
            <tr>
                <td colspan="2"></td>
                <td style="padding: 6px 12px; text-align: right; font-size: 0.9em; color: #7f8c8d;">Subtotal:</td>
                <td style="padding: 6px 12px; text-align: right; font-size: 0.9em; color: #7f8c8d;">${currencySymbol}${invoice.subTotal.toFixed(2)}</td>
            </tr>
            ${
              invoice.taxAmount
                ? `
            <tr>
                <td colspan="2"></td>
                <td style="padding: 6px 12px; text-align: right; font-size: 0.9em; color: #7f8c8d;">Tax:</td>
                <td style="padding: 6px 12px; text-align: right; font-size: 0.9em; color: #7f8c8d;">${currencySymbol}${invoice.taxAmount.toFixed(2)}</td>
            </tr>
            `
                : ""
            }
            ${
              invoice.discount
                ? `
            <tr>
                <td colspan="2"></td>
                <td style="padding: 6px 12px; text-align: right; font-size: 0.9em; color: #e74c3c;">Discount:</td>
                <td style="padding: 6px 12px; text-align: right; font-size: 0.9em; color: #e74c3c;">-${currencySymbol}${invoice.discount.toFixed(2)}</td>
            </tr>
            `
                : ""
            }
            <tr>
                <td colspan="2"></td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 1.1em; border-top: 1px solid #ddd;">Grand Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 1.1em; color: #2c3e50; border-top: 1px solid #ddd;">
                    ${currencySymbol}${invoice.grandTotal.toFixed(2)}
                </td>
            </tr>

            ${
              invoice.notes
                ? `
            <tr>
                <td colspan="4" style="padding-top: 20px;">
                    <div style="font-size: 0.85em; color: #7f8c8d; max-width: 80%;">
                        <strong>Notes:</strong> ${invoice.notes}
                    </div>
                </td>
            </tr>
            `
                : ""
            }

            <tr>
                <td colspan="4" style="margin-top: 40px; padding-top: 30px;">
                    <div style="border-top: 2px solid #2c3e50; padding-top: 15px; width: 60%;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Payment Information</h4>
                        
                        ${
                          user.bankDetails?.bankName
                            ? `
                          <p style="margin: 3px 0; font-size: 0.9em;"><strong>Bank Name:</strong> ${user.bankDetails.bankName}</p>
                          <p style="margin: 3px 0; font-size: 0.9em;"><strong>Account Number:</strong> ${user.bankDetails.accountNumber || "N/A"}</p>
                          <p style="margin: 3px 0; font-size: 0.9em;"><strong>IFSC Code:</strong> ${user.bankDetails.ifscCode || "N/A"}</p>
                        `
                            : ""
                        }
                        
                        ${user.bankDetails?.swiftCode ? `<p style="margin: 3px 0; font-size: 0.9em;"><strong>SWIFT Code:</strong> ${user.bankDetails.swiftCode}</p>` : ""}
                        
                        ${
                          user.bankDetails?.upiId
                            ? `
                          <p style="margin: 6px 0 3px 0; font-size: 0.9em; color: #16a085;">
                            <strong>UPI ID:</strong> ${user.bankDetails.upiId}
                          </p>
                        `
                            : ""
                        }
                        
                        ${invoice.paymentTerms ? `<p style="margin: 10px 0 0 0; font-size: 0.85em; color: #2c3e50;"><strong>Terms:</strong> ${invoice.paymentTerms}</p>` : ""}
                    </div>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

  let browser;
  try {
    const chromePath = await locateChrome();

    if (!chromePath) {
      throw new Error(
        "Google Chrome could not be found on this system. Please make sure it is installed.",
      );
    }

    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20px", bottom: "20px" },
      printBackground: true,
    });

    return pdfBuffer;
  } catch (error) {
    console.error("Puppeteer PDF generation failed:", error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
