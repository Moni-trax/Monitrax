const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

const checkTargetHealth = async () => {
  try {
    const targets = await prisma.monitoringTarget.findMany();

    for (const target of targets) {
      const startTime = Date.now();
      try {
        // Ping the target
        const response = await axios.get(target.url, {
          timeout: 5000, // 5-second timeout
          validateStatus: (status) => status >= 200 && status < 400, // Consider 2xx and 3xx as online
        });

        const responseTime = Date.now() - startTime;

        await prisma.monitoringTarget.update({
          where: { id: target.id },
          data: {
            status: "online",
            responseTime: responseTime,
            lastChecked: new Date(),
          },
        });
      } catch (error) {
        // If the request fails or times out, mark as offline
        await prisma.monitoringTarget.update({
          where: { id: target.id },
          data: {
            status: "offline",
            responseTime: null,
            lastChecked: new Date(),
          },
        });
      }
    }
  } catch (error) {
    console.error("Monitoring service error : ",error);
    
  }
};

// Start the polling loop (runs every 30 seconds)
const startMonitoring = () => {
  console.log("Background monitoring service started...");
  setInterval(checkTargetHealth, 30000);

  // Run an initial check immediately on startup
  checkTargetHealth();
};

module.exports = { startMonitoring };
