const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
/**
 * Obtener usuarios por rol con filtros y paginación
 */
const getUsersByRole = async (filters) => {
  const {
    role,
    status,
    search,
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  // Construir condiciones de búsqueda
  const where = {};

  // Filtro por rol
  if (role) {
    where.role = role.toUpperCase();
  }

  // Filtro por estado
  if (status) {
    where.status = status.toUpperCase();
  }

  // Búsqueda por nombre o email
  if (search) {
    where.OR = [
      { email: { contains: search.toLowerCase() } },
      { fullname: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Incluir datos relacionados según el rol
  const include = {
    patient: true,
  };

  // Ejecutar consultas en paralelo
  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      include,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        status: true,
        specialty: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            documentNumber: true,
            birthDate: true,
            age: true,
            gender: true,
            phone: true,
            address: true,
          },
        },
      },
    }),
    prisma.users.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Obtener estadísticas de usuarios por rol
 */
const getUsersStatsByRole = async () => {
  const stats = await prisma.users.groupBy({
    by: ['role', 'status'],
    _count: {
      id: true,
    },
  });

  // Organizar estadísticas por rol
  const organized = {};
  
  stats.forEach((stat) => {
    if (!organized[stat.role]) {
      organized[stat.role] = {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
      };
    }
    
    organized[stat.role].total += stat._count.id;
    
    if (stat.status === 'ACTIVE') {
      organized[stat.role].active = stat._count.id;
    } else if (stat.status === 'INACTIVE') {
      organized[stat.role].inactive = stat._count.id;
    } else if (stat.status === 'PENDING') {
      organized[stat.role].pending = stat._count.id;
    }
  });

  return organized;
};

/**
 * Obtener un usuario por ID con información completa
 */
const getUserById = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullname: true,
      role: true,
      status: true,
      specialty: true,
      createdAt: true,
      updatedAt: true,
      patient: {
        select: {
          id: true,
          documentNumber: true,
          birthDate: true,
          age: true,
          gender: true,
          phone: true,
          address: true,
        },
      },
    },
  });

  return user;
};

/**
 * Obtener todos los médicos con sus especialidades
 */
const getAllDoctors = async () => {
  const doctors = await prisma.users.findMany({
    where: {
      role: 'MEDICO',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      fullname: true,
      email: true,
      specialty: true,
    },
    orderBy: {
      fullname: 'asc',
    },
  });

  return doctors;
};

/**
 * Obtener médicos agrupados por especialidad
 */
const getDoctorsBySpecialty = async () => {
  const doctors = await prisma.users.findMany({
    where: {
      role: 'MEDICO',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      fullname: true,
      email: true,
      specialty: true,
    },
    orderBy: {
      specialty: 'asc',
    },
  });

  // Agrupar por especialidad
  const grouped = doctors.reduce((acc, doctor) => {
    const specialty = doctor.specialty || 'Sin especialidad';
    if (!acc[specialty]) {
      acc[specialty] = [];
    }
    acc[specialty].push({
      id: doctor.id,
      fullname: doctor.fullname,
      email: doctor.email,
    });
    return acc;
  }, {});

  return grouped;
};

module.exports = {
  getUsersByRole,
  getUsersStatsByRole,
  getUserById,
  getAllDoctors,
  getDoctorsBySpecialty,
};