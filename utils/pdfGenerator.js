import PDFDocument from "pdfkit";

export const generateInvoicePDF = async (invoice, user, client) => {
  const selectedCurrency =
    invoice.currency || user.companyDetails?.currency || "USD";

  const currencySymbols = {
    USD: "$",
    INR: "Rs.",
    EUR: "E",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
    JPY: "Y",
    CNY: "Y",
    SGD: "S$",
    AED: "AED",
  };

  const currencySymbol = currencySymbols[selectedCurrency] || "$";

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      doc
        .fillColor("#2c3e50")
        .fontSize(22)
        .text(
          user.companyDetails?.businessName || user.name.toUpperCase(),
          40,
          40,
        );
      doc
        .fillColor("#7f8c8d")
        .fontSize(24)
        .text("INVOICE", 40, 40, { align: "right" });
      doc.moveDown(1.5);

      const startY = doc.y;
      doc.fillColor("#2c3e50").fontSize(11).text("From:", 40, startY);
      doc.fillColor("#333333").fontSize(10).text(user.name);
      if (user.companyDetails?.address) doc.text(user.companyDetails.address);
      doc.text(user.email);
      if (user.companyDetails?.taxId)
        doc
          .fontSize(9)
          .text(`Tax ID: ${user.companyDetails.taxId}`)
          .fontSize(10);

      doc
        .fillColor("#2c3e50")
        .fontSize(11)
        .text("To:", 40, startY, { align: "right" });
      doc
        .fillColor("#333333")
        .fontSize(10)
        .text(client.clientName, { align: "right" });
      if (client.companyName) doc.text(client.companyName, { align: "right" });
      if (client.address) doc.text(client.address, { align: "right" });
      doc.text(client.email, { align: "right" });
      if (client.taxId)
        doc
          .fontSize(9)
          .text(`Tax ID: ${client.taxId}`, { align: "right" })
          .fontSize(10);
      doc.moveDown(2);

      const infoY = doc.y;
      doc.rect(40, infoY, 515, 30).fill("#f8f9fa");
      doc
        .fillColor("#333333")
        .fontSize(10)
        .text(`Invoice No: ${invoice.invoiceNumber}`, 50, infoY + 10);
      doc.text(
        `Date of Issue: ${new Date(invoice.issueDate).toLocaleDateString()}`,
        220,
        infoY + 10,
      );
      doc
        .fillColor("#e74c3c")
        .text(
          `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
          40,
          infoY + 10,
          { align: "right" },
        );
      doc.moveDown(2.5);

      let tableY = doc.y;

      doc.rect(40, tableY, 515, 25).fill("#2c3e50");
      doc.fillColor("#ffffff").fontSize(10);
      doc.text("Description", 50, tableY + 8);
      doc.text("Qty", 280, tableY + 8, { width: 40, align: "center" });
      doc.text("Unit Price", 340, tableY + 8, { width: 90, align: "right" });
      doc.text("Amount", 450, tableY + 8, { width: 95, align: "right" });

      tableY += 25;

      invoice.items.forEach((item) => {
        doc.fillColor("#333333").fontSize(10);

        doc.text(item.itemName, 50, tableY + 10, { width: 220 });
        doc.text(item.quantity.toString(), 280, tableY + 10, {
          width: 40,
          align: "center",
        });
        doc.text(
          `${currencySymbol}${item.price.toFixed(2)}`,
          340,
          tableY + 10,
          { width: 90, align: "right" },
        );
        doc.text(
          `${currencySymbol}${item.total.toFixed(2)}`,
          450,
          tableY + 10,
          { width: 95, align: "right" },
        );

        let rowHeight = 25;
        if (item.taxRate) {
          doc
            .fillColor("#7f8c8d")
            .fontSize(8)
            .text(`Tax: ${item.taxRate}%`, 50, tableY + 23);
          rowHeight = 35;
        }

        doc
          .strokeColor("#eeeeee")
          .lineWidth(0.5)
          .moveTo(40, tableY + rowHeight)
          .lineTo(555, tableY + rowHeight)
          .stroke();
        tableY += rowHeight;
      });

      tableY += 15;

      doc
        .fillColor("#7f8c8d")
        .fontSize(10)
        .text("Subtotal:", 300, tableY, { width: 130, align: "right" });
      doc
        .fillColor("#333333")
        .text(`${currencySymbol}${invoice.subTotal.toFixed(2)}`, 450, tableY, {
          width: 95,
          align: "right",
        });
      tableY += 18;

      if (invoice.taxAmount) {
        doc
          .fillColor("#7f8c8d")
          .text("Tax:", 300, tableY, { width: 130, align: "right" });
        doc
          .fillColor("#333333")
          .text(
            `${currencySymbol}${invoice.taxAmount.toFixed(2)}`,
            450,
            tableY,
            { width: 95, align: "right" },
          );
        tableY += 18;
      }

      if (invoice.discount) {
        doc
          .fillColor("#e74c3c")
          .text("Discount:", 300, tableY, { width: 130, align: "right" });
        doc.text(
          `-${currencySymbol}${invoice.discount.toFixed(2)}`,
          450,
          tableY,
          { width: 95, align: "right" },
        );
        tableY += 18;
      }

      doc
        .strokeColor("#dddddd")
        .lineWidth(1)
        .moveTo(350, tableY)
        .lineTo(555, tableY)
        .stroke();
      tableY += 8;

      doc
        .fillColor("#2c3e50")
        .fontSize(12)
        .text("Grand Total:", 300, tableY, { width: 130, align: "right" });
      doc.text(
        `${currencySymbol}${invoice.grandTotal.toFixed(2)}`,
        450,
        tableY,
        { width: 95, align: "right" },
      );
      tableY += 30;

      if (invoice.notes) {
        doc.fillColor("#7f8c8d").fontSize(10).text("Notes:", 40, tableY);
        doc.fillColor("#333333").text(invoice.notes, { width: 300 });
        tableY += doc.heightOfString(invoice.notes, { width: 300 }) + 25;
      }

      if (tableY > 640) {
        doc.addPage();
        tableY = 40;
      }

      doc
        .strokeColor("#2c3e50")
        .lineWidth(2)
        .moveTo(40, tableY)
        .lineTo(250, tableY)
        .stroke();
      tableY += 10;

      doc
        .fillColor("#2c3e50")
        .fontSize(11)
        .text("Payment Information", 40, tableY);
      doc.fontSize(9.5).fillColor("#333333");
      tableY += 15;

      if (user.bankDetails?.bankName) {
        doc.text(`Bank Name: ${user.bankDetails.bankName}`, 40, tableY);
        doc.text(`Account Number: ${user.bankDetails.accountNumber || "N/A"}`);
        doc.text(`IFSC Code: ${user.bankDetails.ifscCode || "N/A"}`);
        tableY += 35;
      }

      if (user.bankDetails?.swiftCode) {
        doc.text(`SWIFT Code: ${user.bankDetails.swiftCode}`, 40, tableY);
        tableY += 12;
      }

      if (user.bankDetails?.upiId) {
        doc
          .fillColor("#16a085")
          .text(`UPI ID: ${user.bankDetails.upiId}`, 40, tableY);
        tableY += 15;
      }

      if (invoice.paymentTerms) {
        doc
          .fillColor("#2c3e50")
          .text(`Terms: ${invoice.paymentTerms}`, 40, tableY);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
