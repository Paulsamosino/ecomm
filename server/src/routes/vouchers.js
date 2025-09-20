const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');
const voucherController = require('../controllers/voucherController');

// Public validation endpoint
router.post('/validate', voucherController.validateVoucher);
// Redeem when creating order
router.post('/redeem', protect, voucherController.redeemVoucher);

// Admin routes
const isAdmin = checkRole('admin');
router.post('/', protect, isAdmin, voucherController.createVoucher);
router.get('/', protect, isAdmin, voucherController.listVouchers);
router.get('/:code', protect, isAdmin, voucherController.getVoucher);
router.put('/:id', protect, isAdmin, voucherController.updateVoucher);
router.delete('/:id', protect, isAdmin, voucherController.deleteVoucher);

module.exports = router;
