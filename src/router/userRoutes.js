const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authenticate, checkRole } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/users/stats
 * Obtener estadísticas de usuarios (solo administradores)
 */
router.get('/stats', checkRole('ADMINISTRADOR'), userController.getUsersStats);

/**
 * GET /api/users/doctors/all
 * Obtener todos los médicos activos
 */
router.get('/doctors/all', userController.getAllDoctors);

/**
 * GET /api/users/doctors/by-specialty
 * Obtener médicos agrupados por especialidad
 */
router.get('/doctors/by-specialty', userController.getDoctorsBySpecialty);

/**
 * GET /api/users
 * Obtener todos los usuarios con filtros (solo administradores)
 * Query params: role, status, search, page, limit
 */
router.get('/', checkRole('ADMINISTRADOR'), userController.getAllUsers);

/**
 * GET /api/users/role/:role
 * Obtener usuarios por rol específico (solo administradores)
 */
router.get('/role/:role', checkRole('ADMINISTRADOR'), userController.getUsersByRole);

/**
 * GET /api/users/:id
 * Obtener un usuario por ID
 */
router.get('/:id', userController.getUserById);

module.exports = router;