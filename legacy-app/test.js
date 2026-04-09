const fs = require('fs');
let out = "CWD: " + process.cwd() + "\n";
try {
  const express = require('express');
  out += "Express loaded successfully\n";
  const open = require('open');
  out += "Open loaded successfully\n";
} catch(e) {
  out += "Error loading module: " + e.message + "\n";
  out += "Paths searched:\n" + JSON.stringify(module.paths, null, 2) + "\n";
}
fs.writeFileSync('test_out.txt', out);
