import express from "express";
import cors from "cors";
import { db } from "./lib/db.js";
import profileRouter from "./src/routers/profile_router.js";
import friendsRouter from "./src/routers/friends_router.js";
import groupsRouter from "./src/routers/groups_router.js";
import authRouter from "./src/routers/auth_router.js";

const app = express();

app.use(express.json());
app.use(cors());

// Add routers
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/groups", groupsRouter);

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.get("/delete", async (req, res) => {
  try {
    const query = `
      MATCH (n)
      DETACH DELETE n
    `;
    await db.executeQuery(query);
    res.json({ success: true, message: "All nodes deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server URL: http://localhost:${PORT}`);
});
