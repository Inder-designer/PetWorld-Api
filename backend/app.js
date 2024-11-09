const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv")
const session = require("express-session");
const cookieSession = require("cookie-session");

const errorMiddleware = require("./middleware/error");

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "backend/config/config.env" });
}

app.use(express.json({ limit: '10mb' }));

// CORS Middleware 
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(
  cookieSession({
    name: "session",
    keys: ["Petworld"],
    maxAge: 24 * 60 * 60 * 1000 * 25, // 25 days
    secure: process.env.NODE_ENV === "production", // Set true in production for HTTPS only
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
  })
);

// Express session setup (optional if not using express-session)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true, // Prevent client-side JS from accessing cookies
      sameSite: "none", // SameSite for cross-site cookies in production
      maxAge: 24 * 60 * 60 * 1000 * 25, // 25 day
    },
  })
);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(fileUpload());

// Route Imports
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");
const cart = require("./routes/cartRoute");
const address = require("./routes/addressRoute");
const category = require("./routes/categoryRoute");
const attribute = require("./routes/attributeRoute");
const wishlist = require("./routes/wishlistRoute");

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);
app.use("/api/v1", cart);
app.use("/api/v1", address);
app.use("/api/v1", category);
app.use("/api/v1", attribute);
app.use("/api/v1", wishlist);

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

// Middleware for Errors
app.use(errorMiddleware);

module.exports = app;
