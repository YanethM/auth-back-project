const jwt = require('jsonwebtoken');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No se proporcionó token de autenticación",
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: "Usuario inactivo o no verificado",
      });
    }

    // Adjuntar usuario al request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en authenticate:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error de autenticación",
      error: error.message,
    });
  }
};

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a este recurso",
        requiredRole: allowedRoles,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = { authenticate, checkRole };



