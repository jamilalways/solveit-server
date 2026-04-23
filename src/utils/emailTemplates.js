exports.bidReceivedTemplate = (clientName, problemTitle, solverName) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#4f46e5">New Bid Received 🎉</h2>
  <p>Hi ${clientName},</p>
  <p><strong>${solverName}</strong> has submitted a proposal on your problem:</p>
  <p style="background:#f8f9fc;padding:12px 16px;border-radius:8px;font-weight:600">${problemTitle}</p>
  <a href="${process.env.CLIENT_URL}/problems" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">View Proposal</a>
  <p style="color:#aaa;font-size:12px;margin-top:24px">SolveIt — Bangladesh's Problem Solving Marketplace</p>
</div>`

exports.bidAcceptedTemplate = (solverName, problemTitle) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#16a34a">Your Bid Was Accepted! ✅</h2>
  <p>Hi ${solverName},</p>
  <p>Congratulations! Your proposal on <strong>${problemTitle}</strong> has been accepted.</p>
  <p>The client has been notified to deposit funds into escrow. You will receive a notification when you can start working.</p>
  <a href="${process.env.CLIENT_URL}/dashboard/solver" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">View Dashboard</a>
  <p style="color:#aaa;font-size:12px;margin-top:24px">SolveIt</p>
</div>`

exports.contractCompletedTemplate = (solverName, amount, problemTitle) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#16a34a">Payment Released 💰</h2>
  <p>Hi ${solverName},</p>
  <p>Your payment of <strong>৳ ${amount.toLocaleString()}</strong> for <strong>${problemTitle}</strong> has been released to your wallet.</p>
  <a href="${process.env.CLIENT_URL}/dashboard/solver" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">View Earnings</a>
  <p style="color:#aaa;font-size:12px;margin-top:24px">SolveIt</p>
</div>`

exports.welcomeTemplate = (name, role) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#4f46e5">Welcome to SolveIt! 🚀</h2>
  <p>Hi ${name},</p>
  <p>Your ${role} account has been created successfully.</p>
  ${role === 'client'
    ? '<p>You can now post problems and get them solved by expert solvers.</p>'
    : '<p>You can now browse open problems and start earning by solving them.</p>'}
  <a href="${process.env.CLIENT_URL}" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">Get Started</a>
  <p style="color:#aaa;font-size:12px;margin-top:24px">SolveIt</p>
</div>`

exports.resetPasswordTemplate = (name, resetUrl) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#4f46e5">Reset Your Password 🔐</h2>
  <p>Hi ${name},</p>
  <p>You requested to reset your password. Click the button below to set a new one:</p>
  <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">Reset Password</a>
  <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email. The link will expire in 10 minutes.</p>
  <p style="color:#aaa;font-size:12px;margin-top:12px">SolveIt</p>
</div>`

