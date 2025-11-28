import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import secretRouter from "./routes/secret.js";

const app = express();

// must come AFTER app is defined
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ limit: "250mb", extended: true }));
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "https://secure-secrets.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use("/api/secrets", secretRouter);

app.get("/_health", (req, res) => res.send("ok"));

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI, { dbName: "secretsdb" })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server running on " + PORT));
  })
  .catch((err) => {
    console.error("MongoDB connection error");
    process.exit(1);
  });
