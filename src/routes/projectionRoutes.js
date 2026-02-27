import express from "express";
import { rebuildProjections, getProjectionStatus } from "../projections/projector.js";

const router = express.Router();

router.post("/projections/rebuild", async (req, res) => {
  await rebuildProjections();
  res.status(202).json({ message: "Projection rebuild initiated." });
});

router.get("/projections/status", async (req, res) => {
  const status = await getProjectionStatus();
  res.json(status);
});

export default router;