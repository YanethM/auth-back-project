# Ejecuta el proyecto:
npm i
npx prisma db push --force-reset
npx prisma db push
npm run dev

/**
   * ENDPOINT 1: REGISTRO
   * POST http://localhost:3002/api/v1/auth/sign-up
   * Payload esperado:
   * {
   *   "fullname": "Nombre Completo",
   *   "email": "email@ejemplo.com",
   *   "current_password": "Password123"
   * }
   */

  /**
   * ENDPOINT 2: VERIFICACIÓN DE EMAIL
   * POST http://localhost:3002/api/v1/auth/verify-email
   * Payload esperado:
   * {
   *   "email": "email@ejemplo.com",
   *   "verificationCode": "123456"
   * }
   */

  /**
   * ENDPOINT 3: INICIO DE SESIÓN
   * POST http://localhost:3002/api/v1/auth/signin
   * Payload esperado:
   * {
   *   "email": "email@ejemplo.com",
   *   "password": "Password123"
   * }
   */
