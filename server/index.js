require("dotenv").config();
const express = require("express");
const session = require("express-session") 
const app = express();
const cors = require("cors");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/files");
const conversationRoutes = require("./routes/conversations");
const bloodReportRoutes = require("./routes/bloodReports");

const MongoDBStore = require('connect-mongodb-session')(session);

// database connection
connection();

// middlewares
app.use(express.json());
app.use(cors());

// session config
const store = new MongoDBStore({
    uri: process.env.DB,
    collection: 'sessions'
});

app.use(session({
    secret: 'secret_key', // Replace with your secret
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours (adjust as needed)
        expires: new Date(Date.now() + (24 * 60 * 60 * 1000)) // Same as maxAge
    },
    store: store
}));

// routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/bloodreport", bloodReportRoutes);

const port = process.env.PORT || 8080;
app.listen(port, console.log(`Listening on port ${port}...`));
