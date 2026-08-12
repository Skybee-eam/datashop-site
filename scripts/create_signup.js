const fs = require('fs');

let loginHtml = fs.readFileSync('login.html', 'utf8');

// Update title
let signupHtml = loginHtml.replace('<title>Login — DataHub Ghana</title>', '<title>Sign Up — DataHub Ghana</title>');

// Update header
signupHtml = signupHtml.replace('<h1>Welcome Back</h1>', '<h1>Create Account</h1>');
signupHtml = signupHtml.replace('<p>Sign in to manage your DataHub reseller account</p>', '<p>Join DataHub and start buying cheap data</p>');

// Update form fields
const oldForm = `<div class="form-group">
          <label for="email">Email Address or Phone</label>
          <input type="text" id="email" class="form-control" placeholder="e.g. 024XXXXXXX or name@email.com" required>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" class="form-control" placeholder="••••••••" required>
        </div>
        
        <div class="form-options">
          <label><input type="checkbox"> Remember me</label>
          <a href="#">Forgot Password?</a>
        </div>`;

const newForm = `<div class="form-group">
          <label for="fullname">Full Name</label>
          <input type="text" id="fullname" class="form-control" placeholder="John Doe" required>
        </div>
        
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" class="form-control" placeholder="name@email.com" required>
        </div>
        
        <div class="form-group">
          <label for="phone">Phone Number (Ghana)</label>
          <input type="tel" id="phone" class="form-control" placeholder="024XXXXXXX" required>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" class="form-control" placeholder="••••••••" required>
        </div>`;

signupHtml = signupHtml.replace(oldForm, newForm);

// Update button
signupHtml = signupHtml.replace('<button type="submit" class="btn-login">Sign In</button>', '<button type="submit" class="btn-login">Create Account</button>');
signupHtml = signupHtml.replace("alert('Login simulated!');", "alert('Account created! Proceeding to login...'); window.location.href='login.html';");

// Update footer link
signupHtml = signupHtml.replace("Don't have an account? <a href=\"#\">Sign Up</a>", "Already have an account? <a href=\"login.html\">Sign In</a>");

fs.writeFileSync('signup.html', signupHtml, 'utf8');

// Update login.html link
loginHtml = loginHtml.replace("Don't have an account? <a href=\"#\">Sign Up</a>", "Don't have an account? <a href=\"signup.html\">Sign Up</a>");
fs.writeFileSync('login.html', loginHtml, 'utf8');

console.log('Signup page created and linked!');
