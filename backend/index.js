const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Events');
const cors = require("cors");

const app = express();

// Allow requests from localhost:3000
app.use(cors({
   origin: "http://localhost:3000", 
   methods: ['GET', 'POST', 'PUT', 'DELETE'],
   credentials: true,
}));

const port = 5000;

// Middleware to parse incoming JSON data
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/iu-calendar-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Session Setup
app.use(session({
  secret: 'twoRipeTomatoes', 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/iu-calendar-db',
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: false, // Ensure this is false for HTTP (local dev)
    httpOnly: true, // Block JavaScript access to the cookie
    sameSite: "lax", // Prevents CSRF issues
  }
}));

// Route to check session details
app.get('/api/session', (req, res) => {
  if (req.session && req.session.userId) {
    res.status(200).json({
      sessionId: req.session.id,
      userId: req.session.userId,
      message: 'Session is active',
    });
  } else {
    res.status(401).json({ message: 'No active session' });
  }
});
// Log session details for every request
app.use((req, res, next) => {
  console.log("Session data:", req.session);
  next();
});

// Route for testing
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Route for user registration
app.post('/api/register', async (req, res) => {
  console.log("Login request recevied", req.body);
  const { name, email, password } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).send('User already exists');

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user
  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();

  // Store the user ID in the session
  req.session.userId = newUser._id;
  res.status(201).send('User registered successfully');
});

// Route for user login
app.post('/api/login', async (req, res) => {
  console.log("Login request received:", req.body);
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: 'User not found' }); // JSON response
  }

  // Compare the password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid credentials' }); // JSON response
  }
  // Store the user ID in the session
  req.session.userId = user._id;
  console.log('Session data:', req.session); // This line will print session data to the console
  return res.status(200).json({ message: 'User logged in successfully' }); // JSON response
});
// Route for logging out
app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' }); // Return error as JSON
    }
    return res.status(200).json({ message: 'Logged out successfully' }); // Return success as JSON
  });
});
app.post("/api/events", async (req, res) => {
  console.log("Session data during event creation:", req.session); // Debug log
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { title, start, end, type, completed } = req.body;
  console.log("Received event data:", { title, start, end }); // Debug log
  if (!title || !start || !end) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newEvent = new Event({
      title,
      start,
      end,
      userId: req.session.userId,
      type: type || "general", // Default to "general" if not provided
      completed: completed || false,
    });

    await newEvent.save();
    console.log("Event saved successfully:", newEvent); // Debug log
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/api/events", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const events = await Event.find({ userId: req.session.userId });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.put("/api/events/:id/completed", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const event = await Event.findOne({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.completed = !event.completed; // Toggle the completion status
    await event.save();

    res.status(200).json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/api/events/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { title, start, end, type, completed } = req.body;

  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.userId },
      { title, start, end, type, completed },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.delete("/api/events/:id", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const deletedEvent = await Event.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});



