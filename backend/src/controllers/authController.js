const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });
    return res
      .status(201)
      .json({ token, message: "User created successfully" });
  } catch (error) {
    // Log the actual error to the backend terminal for debugging
    console.error("Signup Error");

    // Check if it's a Prisma unique constraint violation (code P2002)
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }
    return res
      .status(500)
      .json({ error: "Internal server error during signup." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ error: "No account found with this email." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ token, message: "Login successful" });
  } catch (error) {
    console.error("Login Error");
    return res
      .status(500)
      .json({ error: "Internal server error during login." });
  }
};
