const userService = require('../services/user.service');

/**
 * GET /api/users
 * Obtener todos los usuarios con filtros
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page, limit } = req.query;

    const result = await userService.getUsersByRole({
      role,
      status,
      search,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/role/:role
 * Obtener usuarios por rol específico
 */
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { status, search, page, limit } = req.query;

    // Validar rol
    const rolesValidos = ['PACIENTE', 'MEDICO', 'ENFERMERO', 'ADMINISTRADOR'];
    if (!rolesValidos.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`,
      });
    }

    const result = await userService.getUsersByRole({
      role: role.toUpperCase(),
      status,
      search,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      role: role.toUpperCase(),
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error en getUsersByRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios por rol',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/stats
 * Obtener estadísticas de usuarios por rol
 */
const getUsersStats = async (req, res) => {
  try {
    const stats = await userService.getUsersStatsByRole();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error en getUsersStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:id
 * Obtener un usuario por ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error en getUserById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo usuario',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/doctors/all
 * Obtener todos los médicos activos
 */
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await userService.getAllDoctors();

    return res.status(200).json({
      success: true,
      data: doctors,
      total: doctors.length,
    });
  } catch (error) {
    console.error('Error en getAllDoctors:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo médicos',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/doctors/by-specialty
 * Obtener médicos agrupados por especialidad
 */
const getDoctorsBySpecialty = async (req, res) => {
  try {
    const grouped = await userService.getDoctorsBySpecialty();

    return res.status(200).json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error('Error en getDoctorsBySpecialty:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo médicos por especialidad',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUsersByRole,
  getUsersStats,
  getUserById,
  getAllDoctors,
  getDoctorsBySpecialty,
};