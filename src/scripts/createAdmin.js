const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log("🔧 Creando administrador inicial...");

    // Verificar si ya existe un administrador
    const existingAdmin = await prisma.users.findUnique({
      where: { email: "admin@hospital.com" },
    });

    if (existingAdmin) {
      console.log("El administrador ya existe");
      console.log("Email:", existingAdmin.email);
      console.log("Nombre:", existingAdmin.fullname);
      return;
    }

    // Crear administrador
    const admin = await prisma.users.create({
      data: {
        email: "admin@hospital.com",
        current_password: await bcrypt.hash("Admin123", 10),
        fullname: "Administrador Principal",
        role: "ADMINISTRADOR",
        status: "ACTIVE", // Ya activado, no necesita verificación
      },
    });

    console.log("Administrador creado exitosamente!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email:    admin@hospital.com");
    console.log("Password: Admin123");
    console.log("Nombre:   Administrador Principal");
    console.log("Rol:      ADMINISTRADOR");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nIMPORTANTE: Cambia esta contraseña después del primer login\n");
  } catch (error) {
    console.error("Error creando administrador:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();