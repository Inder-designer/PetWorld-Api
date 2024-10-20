const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv")
const session = require("express-session");

const errorMiddleware = require("./middleware/error");

// Config
dotenv.config({ path: "backend/config/config.env" })

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(fileUpload());

// CORS Middleware 
app.use(cors({
  origin: "http://localhost:3000", // Replace with your frontend URL
  methods: ['GET', 'HEAD', 'PUT', 'POST', 'OPTIONS', 'DELETE',],
  credentials: true
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Use secure cookies in production
      httpOnly: true, // Prevent client-side JS from accessing cookies
      sameSite: "none", // SameSite for cross-site cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Route Imports
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");
const cart = require("./routes/cartRoute");
const address = require("./routes/addressRoute");
const category = require("./routes/categoryRoute");
const attribute = require("./routes/attributeRoute");

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);
app.use("/api/v1", cart);
app.use("/api/v1", address);
app.use("/api/v1", category);
app.use("/api/v1", attribute);

app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
});

// Middleware for Errors
app.use(errorMiddleware);

module.exports = app;
