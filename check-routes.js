const express = require('express');
const app = require('./src/server'); // This might not work if server.js doesn't export app

// Wait, server.js doesn't export app. I need to modify it or create a mock.
// Actually, I'll just check if I can require the routes directly.

const dmRoutes = require('./src/routes/dm.routes');
console.log('DM Routes loaded:', !!dmRoutes);
if (dmRoutes && dmRoutes.stack) {
  dmRoutes.stack.forEach(r => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    }
  });
}
