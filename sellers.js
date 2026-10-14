const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');

// GET all sellers
router.get('/', async (req, res) => {
  try {
    const sellers = await Seller.find().sort({ name: 1 });
    res.json(sellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST create seller
router.post('/', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom est requis' });

    const seller = new Seller({ name, phone: phone || '' });
    await seller.save();
    res.status(201).json(seller);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création' });
  }
});

// PATCH update seller
router.patch('/:id', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { name, phone },
      { new: true }
    );
    if (!seller) return res.status(404).json({ message: 'Vendeur non trouvé' });
    res.json(seller);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la modification' });
  }
});

// DELETE seller
router.delete('/:id', async (req, res) => {
  try {
    const seller = await Seller.findByIdAndDelete(req.params.id);
    if (!seller) return res.status(404).json({ message: 'Vendeur non trouvé' });
    res.json({ message: 'Vendeur supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

module.exports = router;