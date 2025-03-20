import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
const projectRoutes = require(path.join(__dirname, "./routes/projects.js"));
const weatherRoutes = require(path.join(__dirname, "./routes/weather.js"));

// Load environment variables
dotenv.config();

const app = express();
const port = 5175;

// CORS configuration
const allowedOrigins = ["https://eduardkakosyan.netlify.app"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/weather", weatherRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
