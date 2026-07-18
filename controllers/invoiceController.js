import Invoice from "../models/Invoice.js";
import Client from "../models/Client.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import { sendInvoiceEmail } from "../utils/emailSender.js";

export const createAndSendInvoice = async (req, res) => {
  const { clientId, items, dueDate, discount, currency, status, customFields } =
    req.body;

  try {
    if (!clientId || !items || items.length === 0 || !dueDate) {
      return res
        .status(400)
        .json({ message: "Missing required invoice details" });
    }

    const client = await Client.findById(clientId);
    const user = await User.findById(req.user._id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    let subTotal = 0;
    let totalTaxAmount = 0;

    const processedItems = items.map((item) => {
      const itemQuantity = Number(item.quantity) || 1;
      const itemPrice = Number(item.price) || 0;
      const itemTaxRate = Number(item.taxRate) || 0;

      const baseTotal = itemQuantity * itemPrice;
      const itemTax = baseTotal * (itemTaxRate / 100);

      subTotal += baseTotal;
      totalTaxAmount += itemTax;

      return {
        // Frontend se 'description' aa raha hai, isliye fallback lagaya
        itemName: item.description || item.itemName || "Service Item",
        quantity: itemQuantity,
        price: itemPrice,
        taxRate: itemTaxRate,
        total: baseTotal + itemTax,
      };
    });

    const activeDiscount = Number(discount) || 0;
    const grandTotal = Math.max(0, subTotal + totalTaxAmount - activeDiscount);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    // Invoice Instance banaya
    const invoice = new Invoice({
      userId: req.user._id,
      clientId,
      invoiceNumber,
      items: processedItems,
      subTotal,
      discount: activeDiscount,
      taxAmount: totalTaxAmount,
      grandTotal,
      currency:
        currency || user.companyDetails?.currency || client.currency || "USD",
      dueDate,
      status: status || "Unpaid",
      customFields: customFields || {},
    });

    // Pehle MongoDB me Save karenge taaki data miss na ho
    await invoice.save();

    // Ab PDF aur Email process chalayenge
    try {
      const pdfBuffer = await generateInvoicePDF(invoice, user, client);

      await sendInvoiceEmail(
        client.email,
        client.clientName,
        user.name,
        user.companyDetails?.businessName,
        invoiceNumber,
        pdfBuffer,
      );

      // Email successfully jane par status update
      invoice.emailSent = true;
      await invoice.save();
    } catch (mailError) {
      console.error("Email/PDF background error:", mailError);
      // Data DB me save ho chuka hai, par user ko alert bhejenge ki email fail hua
      return res.status(201).json({
        message: "Invoice saved to DB, but automated email dispatch failed.",
        invoice,
        emailError: mailError.message,
      });
    }

    res.status(201).json({
      message: "Invoice generated, saved, and emailed successfully!",
      invoice,
    });
  } catch (error) {
    console.error("Invoice system error:", error);
    res
      .status(500)
      .json({ message: "Automation failed", error: error.message });
  }
};

// 2. MARK AS PAID (DASHBOARD ACTION)
export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: id, userId: req.user._id }, // Security: Sirf apna invoice update ho sake
      { status: "Paid" },
      { new: true },
    );

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res
      .status(200)
      .json({ message: "Invoice marked as paid!", invoice: updatedInvoice });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};

// 3. DASHBOARD ANALYTICS COUNTERS (LIVE CALCULATION)
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Invoice.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalWorkCount: { $sum: 1 },
          totalEarned: {
            $sum: { $cond: [{ $eq: ["$status", "Paid"] }, "$grandTotal", 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ["$status", "Unpaid"] }, "$grandTotal", 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "Unpaid"] }, 1, 0] },
          },
        },
      },
    ]);

    // Saare invoices list ke liye
    const allInvoices = await Invoice.find({ userId })
      .populate("clientId", "clientName companyName")
      .sort({ createdAt: -1 });

    const metrics = stats[0] || {
      totalWorkCount: 0,
      totalEarned: 0,
      totalPending: 0,
      pendingCount: 0,
    };

    res.status(200).json({ metrics, invoices: allInvoices });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: error.message });
  }
};
