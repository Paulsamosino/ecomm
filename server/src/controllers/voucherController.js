const Voucher = require('../models/Voucher');

// Validate a voucher (public)
exports.validateVoucher = async (req, res) => {
	try {
		const { code, totalAmount = 0 } = req.body;
		// optional user id in body to check if they've already used the voucher
		const userId = req.user && (req.user._id || req.user.id) || req.body.userId;

		if (!code) return res.status(400).json({ message: 'Voucher code is required' });

		const voucher = await Voucher.findOne({ code: String(code).toUpperCase() });
		if (!voucher) return res.status(404).json({ message: 'Voucher not found' });

		const validity = voucher.isValid(Number(totalAmount || 0), userId);
		if (!validity.valid) {
			// map reason to friendly message
			const reason = validity.reason === 'already_used' ? 'Voucher already used by this user' : validity.reason;
			return res.status(400).json({ valid: false, reason });
		}

		const { discount, newTotal } = voucher.applyTo(Number(totalAmount || 0));
		res.json({ valid: true, discount, newTotal, voucher: { code: voucher.code, type: voucher.type, amount: voucher.amount, usesLeft: voucher.usesLeft, expiresAt: voucher.expiresAt } });
	} catch (error) {
		console.error('Error validating voucher:', error);
		res.status(500).json({ message: 'Error validating voucher' });
	}
};

// Redeem a voucher when creating an order (protected)
exports.redeemVoucher = async (req, res) => {
	try {
		const { code, totalAmount = 0 } = req.body;
		const userId = req.user && (req.user._id || req.user.id);

		if (!code) return res.status(400).json({ message: 'Voucher code is required' });

		const voucher = await Voucher.findOne({ code: String(code).toUpperCase() });
		if (!voucher) return res.status(404).json({ message: 'Voucher not found' });

		const validity = voucher.isValid(Number(totalAmount || 0), userId);
		if (!validity.valid) {
			const reason = validity.reason === 'already_used' ? 'Voucher already used by this user' : validity.reason;
			return res.status(400).json({ valid: false, reason });
		}

		// Apply discount
		const { discount, newTotal } = voucher.applyTo(Number(totalAmount || 0));

		// Redeem (decrement usesLeft) and save
		try {
			await voucher.redeem(userId);
		} catch (redeemErr) {
			console.error('Failed to redeem voucher:', redeemErr);
			if (String(redeemErr.message).toLowerCase().includes('already')) {
				return res.status(400).json({ message: 'User already redeemed this voucher' });
			}
			if (String(redeemErr.message).toLowerCase().includes('exhaust')) {
				return res.status(400).json({ message: 'Voucher exhausted' });
			}
			return res.status(500).json({ message: 'Failed to redeem voucher' });
		}

		res.json({ success: true, discount, newTotal, voucher: { code: voucher.code, usesLeft: voucher.usesLeft } });
	} catch (error) {
		console.error('Error redeeming voucher:', error);
		res.status(500).json({ message: 'Error redeeming voucher' });
	}
};

// Admin: create a voucher
exports.createVoucher = async (req, res) => {
	try {
		const data = { ...req.body };
		if (data.code) data.code = String(data.code).toUpperCase();
		// Ensure usesLeft defaults to uses
		if (data.uses != null && (data.usesLeft == null)) data.usesLeft = data.uses;
		data.createdBy = req.user && (req.user._id || req.user.id);

		const voucher = new Voucher(data);
		await voucher.save();

		res.status(201).json(voucher);
	} catch (error) {
		console.error('Error creating voucher:', error);
		// handle duplicate code
		if (error.code === 11000) return res.status(400).json({ message: 'Voucher code already exists' });
		res.status(500).json({ message: 'Error creating voucher' });
	}
};

// Admin: list vouchers
exports.listVouchers = async (req, res) => {
	try {
		const { active } = req.query;
		const filter = {};
		if (active === 'true') filter.active = true;
		if (active === 'false') filter.active = false;

		const vouchers = await Voucher.find(filter).sort({ createdAt: -1 });
		res.json(vouchers);
	} catch (error) {
		console.error('Error listing vouchers:', error);
		res.status(500).json({ message: 'Error listing vouchers' });
	}
};

// Admin: get voucher by code
exports.getVoucher = async (req, res) => {
	try {
		const codeOrId = req.params.code;
		// try by id first
		let voucher = null;
		if (codeOrId && codeOrId.match(/^[0-9a-fA-F]{24}$/)) {
			voucher = await Voucher.findById(codeOrId);
		}
		if (!voucher) {
			voucher = await Voucher.findOne({ code: String(codeOrId).toUpperCase() });
		}

		if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
		res.json(voucher);
	} catch (error) {
		console.error('Error getting voucher:', error);
		res.status(500).json({ message: 'Error getting voucher' });
	}
};

// Admin: update voucher by id
exports.updateVoucher = async (req, res) => {
	try {
		const id = req.params.id;
		const update = { ...req.body };
		if (update.code) update.code = String(update.code).toUpperCase();

		const voucher = await Voucher.findByIdAndUpdate(id, update, { new: true });
		if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
		res.json(voucher);
	} catch (error) {
		console.error('Error updating voucher:', error);
		res.status(500).json({ message: 'Error updating voucher' });
	}
};

// Admin: delete voucher by id
exports.deleteVoucher = async (req, res) => {
	try {
		const id = req.params.id;
		const voucher = await Voucher.findByIdAndDelete(id);
		if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
		res.json({ message: 'Voucher deleted' });
	} catch (error) {
		console.error('Error deleting voucher:', error);
		res.status(500).json({ message: 'Error deleting voucher' });
	}
};
