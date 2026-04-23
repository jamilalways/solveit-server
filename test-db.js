const mongoose = require('mongoose');
require('dotenv').config();
const Wallet = require('./src/models/Wallet');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Wallet.updateMany({}, { $inc: { escrowBalance: 10000 } });
  console.log('Successfully funded existing wallets with faux escrow balance to prevent validation crashes during local legacy testing.');
  process.exit(0);
}).catch(console.error);