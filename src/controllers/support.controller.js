const SupportTicket = require('../models/SupportTicket');

// @desc    Create a new support ticket
// @route   POST /api/support
// @access  Private
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      message
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all support tickets (admin only)
// @route   GET /api/support/admin
// @access  Private/Admin
exports.getAllTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find().populate('user', 'firstName lastName email role').sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket status (admin only)
// @route   PUT /api/support/:id/status
// @access  Private/Admin
exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { status, adminReply } = req.body;
    
    let ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = status || ticket.status;
    if (adminReply !== undefined) {
      ticket.adminReply = adminReply;
    }

    await ticket.save();

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};
