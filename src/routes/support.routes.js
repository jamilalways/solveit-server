const express = require('express');
const { createTicket, getAllTickets, updateTicketStatus, getMyTickets } = require('../controllers/support.controller');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Users (client, solver) routes
router.post('/', protect, createTicket);
router.get('/my-tickets', protect, getMyTickets);

// Admin routes
router.get('/admin', protect, restrictTo('admin'), getAllTickets);
router.put('/:id/status', protect, restrictTo('admin'), updateTicketStatus);

module.exports = router;
