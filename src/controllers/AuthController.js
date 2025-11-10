const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateVerificationCode, sendVerificationEmail } = require("../config/emailConfig");

const signup = async (req, res) => {
  let { email, current_password, fullname } = req.body;
  if (!email || !current_password || !fullname) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }
  // Convertir en minuscula y eliminar espacios en blanco
  if (email) email = email.toLowerCase().trim();

  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ message: "Formato de correo electrónico es incorrecto" });
  }

  if (current_password.length < 6) {
    return res
      .status(400)
      .json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }

  // Validar que la contraseña tenga texto y al menos un número
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
  if (!passwordRegex.test(current_password)) {
    return res.status(400).json({
      message:
        "La contraseña debe contener al menos un número y una letra a - Z",
    });
  }

  // Validar que el correo no exista en la BD
  let userExists = await prisma.users.findUnique({ where: { email } });
  if (userExists) {
    return res.status(400).json({ message: "El correo ya está registrado" });
  }
 //Incluye el código de verificación -> 15 minutos
  const verificationCode = generateVerificationCode();
  const verificationExpires = new Date();
  verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

  // Crear usuario con estado PENDING
  const createUser = await prisma.users.create({
    data: {
      email,
      current_password: await bcrypt.hash(current_password, 10),
      fullname,
      status: "PENDING",
      verificationCode,
      verificationCodeExpires: verificationExpires,
    },
  });
  const emailResult = await sendVerificationEmail(email, fullname, verificationCode);
    
    if (!emailResult.success) {
      // Si falla el envío, eliminar el usuario creado
      await prisma.users.delete({ where: { id: createUser.id } });
      return res.status(500).json({ 
        message: "Error enviando email de verificación. Intenta nuevamente." 
      });
    }
  return res.status(201).json(createUser);
};

const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    if (!email || !verificationCode) {
      return res.status(400).json({
        message: "Email y código de verificación son requeridos",
      });
    }
    // Buscar usuario por email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    if (user.status === "ACTIVE") {
      return res.status(400).json({ message: "La cuenta ya está verificada" });
    }
    // Verificar si el código ha expirado
    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({
        message: "El código de verificación ha expirado",
      });
    }
    // Verificar el código
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        message: "Código de verificación incorrecto",
      });
    }
    // Activar la cuenta
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: {
        status: "ACTIVE",
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return res.status(200).json({
      message: "Email verificado exitosamente. Tu cuenta está ahora activa.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullname: updatedUser.fullname,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email es requerido" });
    }

    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    if (user.status === "ACTIVE") {
      return res.status(400).json({ message: "La cuenta ya está verificada" });
    }

    // Generar nuevo código
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

    // Actualizar usuario con nuevo código
    await prisma.users.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpires: verificationExpires,
      },
    });

    // Enviar nuevo email
    const emailResult = await sendVerificationEmail(
      email,
      user.fullname,
      verificationCode
    );

    if (!emailResult.success) {
      return res.status(500).json({
        message: "Error enviando email de verificación",
      });
    }

    return res.status(200).json({
      message: "Nuevo código de verificación enviado a tu email",
    });
  } catch (error) {
    console.error("Error en resendVerificationCode:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

const signin = async (req, res) => {
  try {
    let { email, password } = req.body;
console.log(email, password);

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos",
      });
    }

    // Normalizar email
    email = email.toLowerCase().trim();

    // Validar formato de email
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Formato de correo electrónico incorrecto",
      });
    }

    // Buscar usuario por email
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        patient: true, // Incluir datos de paciente si existe
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.current_password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    // Verificar estado del usuario
    if (user.status === "PENDING") {
      return res.status(403).json({
        message: "Debes verificar tu email antes de iniciar sesión",
        requiresVerification: true,
      });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({
        message: "Usuario inactivo. Contacte al administrador",
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Token válido por 24 horas
    );

    // Preparar respuesta según el rol
    const userResponse = {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      status: user.status,
    };

    // Si es médico, incluir especialidad
    if (user.role === "MEDICO") {
      userResponse.specialty = user.specialty;
    }

    // Si es paciente, incluir datos del paciente
    if (user.role === "PACIENTE" && user.patient) {
      userResponse.patient = {
        id: user.patient.id,
        documentNumber: user.patient.documentNumber,
        age: user.patient.age,
        gender: user.patient.gender,
        phone: user.patient.phone,
        address: user.patient.address,
      };
    }

    return res.status(200).json({
      message: "Login exitoso",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error en signin:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

module.exports = { signup, verifyEmail, resendVerificationCode, signin };
