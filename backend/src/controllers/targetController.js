const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createTarget = async (req, res) => {
  try {
    const { name, url, type } = req.body;
    const userId = req.user.id; // Comes from authMiddleware

    const target = await prisma.monitoringTarget.create({
      data: { name, url, type, userId },
    });

    res.status(201).json(target);
  } catch (error) {
    console.error("Create Target Error", error);
    res.status(500).json({ error: "Failed to create monitoring target" });
  }
};

exports.getTargets = async (req, res) => {
  try {
    const userId = req.user.id;
    const targets = await prisma.monitoringTarget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(targets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch targets" });
  }
};

exports.deleteTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Ensure the target belongs to the user before deleting
    await prisma.monitoringTarget.deleteMany({
      where: {
        id: parseInt(id),
        userId: userId,
      },
    });

    res.json({ message: "Target deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete target" });
  }
};
