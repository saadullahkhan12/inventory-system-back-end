// Update the POST route to match frontend data
router.post('/', async (req, res) => {
  try {
    const { customerName, paymentType, items } = req.body;

    // Calculate totals from the items sent by frontend
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    // Create slip with the data from frontend
    const newSlip = new Slip({
      customerName,
      paymentType,
      items, // Use the items directly from fro
      totalQuantity,
      totalAmount
    });

    await newSlip.save();

    // Update inventory - we need to find items by name instead of ID
    for (let slipItem of items) {
      await Item.findOneAndUpdate(
        { name: slipItem.itemName },
        { $inc: { quantity: -slipItem.quantity } }
      );
    }

    res.status(201).json(newSlip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});