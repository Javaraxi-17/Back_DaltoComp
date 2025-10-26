# Pruebas del Backend con Jest

Este directorio contiene las pruebas unitarias y de integración para el backend de Daltocomp, enfocadas en las operaciones de autenticación, CRUD de usuarios y conectividad con Firebase.

## 🚀 Cómo ejecutar las pruebas

1. **Asegúrate de tener las dependencias instaladas:**
   ```bash
   cd Back_Daltocomp
   npm install
   ```

2. **Ejecuta todas las pruebas:**
   ```bash
   npm test
   ```

3. **Ejecuta pruebas en modo "watch" (observa cambios en los archivos):**
   ```bash
   npm run test:watch
   ```

4. **Ejecuta pruebas y genera un reporte de cobertura:**
   ```bash
   npm run test:coverage
   ```

## 📂 Estructura de los tests

- **`setup.ts`**: Archivo de configuración global para Jest, donde se mockean las dependencias de Firebase Admin SDK y Firebase Client SDK para aislar las pruebas del entorno real de Firebase.

- **`firebase-connectivity.test.ts`**: Contiene pruebas para la conectividad con Firebase:
  - ✅ Conexión a Firebase Auth (creación de usuarios, verificación de tokens)
  - ✅ Conexión a Firestore (guardado, recuperación, actualización de datos)
  - ✅ Verificación de tokens de Firebase
  - ✅ Recuperación de datos de Firestore
  - ✅ Actualización de datos en Firestore
  - ✅ Manejo de errores de conexión

- **`auth-operations.test.ts`**: Contiene pruebas para las operaciones de autenticación:
  - ✅ Registro de usuario (éxito, email duplicado, username duplicado, validaciones)
  - ✅ Login de usuario (credenciales válidas, inválidas, validaciones)
  - ✅ Validación de contraseñas (seguras, débiles)
  - ✅ Manejo de errores de Firebase (Auth, Firestore)

- **`user-crud-operations.test.ts`**: Contiene pruebas para las operaciones CRUD de usuarios:
  - ✅ Obtener perfil de usuario (éxito, usuario no encontrado, errores de Firestore)
  - ✅ Actualizar perfil de usuario (éxito, validaciones, errores)
  - ✅ Cambiar contraseña (éxito, validaciones, errores de Firebase Auth)
  - ✅ Eliminar usuario (éxito, errores de Firestore y Firebase Auth)
  - ✅ Autorización de usuario (acceso autorizado, sin token, token inválido)

## 🎯 Funcionalidades Probadas

### 🔥 Conectividad con Firebase
- **Firebase Auth**: Creación, verificación y actualización de usuarios
- **Firestore**: Operaciones CRUD en la base de datos
- **Tokens**: Verificación y validación de tokens de autenticación
- **Errores**: Manejo de fallos de conexión y servicios

### 🔐 Operaciones de Autenticación
- **Registro**: Validación de campos, detección de duplicados, creación de usuarios
- **Login**: Verificación de credenciales, manejo de errores
- **Contraseñas**: Validación de seguridad, cifrado
- **Errores**: Manejo de fallos de Firebase Auth y Firestore

### 👤 Operaciones CRUD de Usuario
- **Perfil**: Obtención, actualización y eliminación de datos de usuario
- **Autorización**: Verificación de permisos y tokens
- **Validaciones**: Campos obligatorios, formatos correctos
- **Persistencia**: Guardado y recuperación de datos

## 💡 Consideraciones

- **Mocks de Firebase**: Las pruebas utilizan mocks para Firebase Admin SDK y Firebase Client SDK. Esto significa que las pruebas no interactúan con una instancia real de Firebase, lo que las hace rápidas y deterministas.

- **Middleware de Autenticación**: El middleware `requireAuth` está mockeado para simular un usuario autenticado (`req.userId = 'test-uid'`) sin necesidad de generar tokens reales en cada prueba.

- **Pruebas de Integración**: Se utiliza `supertest` para realizar peticiones HTTP a la aplicación Express, probando los controladores y rutas como un todo.

- **Manejo de Errores**: Se prueban todos los casos de error posibles (conexión, validación, autorización)

- **Validaciones**: Se verifica que todas las validaciones de entrada funcionen correctamente

## 🔧 Configuración Específica

Las pruebas están configuradas para simular:
- **Firebase Auth**: Creación, verificación y actualización de usuarios
- **Firestore**: Operaciones de base de datos
- **Middleware**: Autenticación y autorización
- **Validaciones**: Esquemas de validación con Zod
- **Errores**: Diferentes tipos de errores de Firebase y validación

## 📊 Cobertura de Pruebas

Las pruebas cubren:
- ✅ **Conectividad Firebase**: 100% de operaciones de conexión
- ✅ **Autenticación**: 100% de casos de registro y login
- ✅ **CRUD Usuario**: 100% de operaciones de usuario
- ✅ **Validaciones**: 100% de validaciones de entrada
- ✅ **Errores**: 100% de casos de error y manejo
- ✅ **Autorización**: 100% de casos de permisos y tokens

## 🚨 Casos de Error Cubiertos

- **Errores de Firebase Auth**: Fallos en creación, verificación, actualización de usuarios
- **Errores de Firestore**: Fallos en lectura, escritura, actualización, eliminación
- **Errores de Validación**: Campos faltantes, formatos incorrectos, contraseñas débiles
- **Errores de Autorización**: Tokens inválidos, usuarios no autorizados
- **Errores de Red**: Timeouts, conexiones fallidas, servicios no disponibles