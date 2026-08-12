const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace Naira HTML entity and literal with GHS symbol
html = html.replace(/&#x20A6;/g, 'GH₵');
html = html.replace(/₦/g, 'GH₵');

// Update Phone inputs to Ghana format
html = html.replace(/\+234/g, '+233');
html = html.replace(/08012345678/g, '0241234567');
html = html.replace(/maxlength="11"/g, 'maxlength="10"');

// Update Payment Methods
const oldPayments = `<div class="payment-options">
              <label class="pay-opt active" id="payCard"><input type="radio" name="payment" value="card" checked /><span>&#x1F4B3; Card</span></label>
              <label class="pay-opt" id="payTransfer"><input type="radio" name="payment" value="transfer" /><span>&#x1F3E6; Transfer</span></label>
              <label class="pay-opt" id="payUssd"><input type="radio" name="payment" value="ussd" /><span>&#x1F4F2; USSD</span></label>
            </div>`;

const newPayments = `<div class="payment-options">
              <label class="pay-opt active" id="payMomo"><input type="radio" name="payment" value="momo" checked /><span>&#x1F4F1; Mobile Money</span></label>
              <label class="pay-opt" id="payCard"><input type="radio" name="payment" value="card" /><span>&#x1F4B3; Card</span></label>
            </div>`;
html = html.replace(oldPayments, newPayments);

// Enforce login for checkout button
const oldBtn = '<button class="btn-confirm" onclick="confirmPurchase()">&#x1F680; Confirm &amp; Pay</button>';
const newBtn = '<button class="btn-confirm" onclick="window.location.href=\'login.html\'">&#x1F512; Login to Continue</button>';
html = html.replace(oldBtn, newBtn);

fs.writeFileSync('index.html', html, 'utf8');

let js = fs.readFileSync('app.js', 'utf8');
js = js.replace(/\\u20A6/g, 'GH₵'); // Replace Naira unicode in JS
fs.writeFileSync('app.js', js, 'utf8');

console.log('Fixed currency, phone formats, payment systems, and login flow.');
