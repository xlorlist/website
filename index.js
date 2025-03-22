// server/index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to store temporary verification codes (in-memory for this example)
const verificationCodes = new Map();

// Sample route for your website
app.get('/', (req, res) => {
  res.send('Welcome to Your Discord Hosting Website!');
});

// Example route for verifying user
app.post('/api/auth/verify', async (req, res) => {
  const { email, code, username, password } = req.body;

  // Validate request body
  if (!email || !code || !username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const storedCode = verificationCodes.get(email);

  // Check if verification code is valid
  if (storedCode !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  try {
    // Simulating user creation and checking existing users (you would implement this)
    const existingUser = await storage.getUserByUsername(username); // placeholder for actual user retrieval logic
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Create new user (you would implement this)
    const user = await storage.createUser({
      username,
      password,
      email,
      role: 'user'
    });

    // Remove the verification code once used
    verificationCodes.delete(email);

    res.status(201).json({ 
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user account' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});// server/index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to store temporary verification codes (in-memory for this example)
const verificationCodes = new Map();

// Sample route for your website
app.get('/', (req, res) => {
  res.send('Welcome to Your Discord Hosting Website!');
});

// Example route for verifying user
app.post('/api/auth/verify', async (req, res) => {
  const { email, code, username, password } = req.body;

  // Validate request body
  if (!email || !code || !username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const storedCode = verificationCodes.get(email);

  // Check if verification code is valid
  if (storedCode !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  try {
    // Simulating user creation and checking existing users (you would implement this)
    const existingUser = await storage.getUserByUsername(username); // placeholder for actual user retrieval logic
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Create new user (you would implement this)
    const user = await storage.createUser({
      username,
      password,
      email,
      role: 'user'
    });

    // Remove the verification code once used
    verificationCodes.delete(email);

    res.status(201).json({ 
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user account' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});