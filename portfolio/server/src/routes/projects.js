const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Get all projects
router.get("/", (req, res) => {
  try {
    // Use process.cwd() to get the current working directory
    const projectsPath = path.join(process.cwd(), "dist", "data", "projects.json");
    const projectsData = fs.readFileSync(projectsPath, "utf-8");
    const projects = JSON.parse(projectsData);

    res.status(200).json({
      status: "success",
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch projects",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get a single project by ID
router.get("/:id", (req, res) => {
  try {
    // Use process.cwd() to get the current working directory
    const projectsPath = path.join(process.cwd(), "dist", "data", "projects.json");
    const projectsData = fs.readFileSync(projectsPath, "utf-8");
    const projects = JSON.parse(projectsData);

    const project = projects.find((p) => p.id === parseInt(req.params.id));

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router; 