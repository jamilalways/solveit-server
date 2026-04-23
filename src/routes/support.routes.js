const express = require('express');
const { createTicket, getAllTickets, updateTicketStatus } = require('../controllers/support.controller');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Users (client, solver) can create tickets
router.post('/', protect, createTicket);

// Admin routes
router.get('/admin', protect, restrictTo('admin'), getAllTickets);
router.put('/:id/status', protect, restrictTo('admin'), updateTicketStatus);

module.exports = router;
