import Client from "../models/Client.js";

export const addClient = async (req, res) => {
  const {
    clientName,
    companyName,
    email,
    address,
    phone,
    taxId,
    currency,
    customFields,
  } = req.body;

  try {
    if (!clientName || !email) {
      return res
        .status(400)
        .json({ message: "Client Name and Email are required" });
    }

    const client = await Client.create({
      userId: req.user._id,
      clientName,
      companyName,
      email: email.toLowerCase(),
      address,
      phone,
      taxId,
      currency,
      customFields,
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({
      message: "Server Error while adding client",
      error: error.message,
    });
  }
};

export const getMyClients = async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({
      message: "Server Error while fetching clients",
      error: error.message,
    });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    if (client.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this client" });
    }

    await Client.findByIdAndDelete(id);

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Server Error while deleting client",
      error: error.message,
    });
  }
};
