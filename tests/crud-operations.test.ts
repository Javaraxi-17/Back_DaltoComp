import request from 'supertest';
import { app } from '../src/index';

describe('👤 Pruebas de Operaciones CRUD', () => {
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Crear usuario de prueba para las operaciones CRUD
    const testData = {
      name: 'CRUD Test User',
      email: `crud-test-${Date.now()}@example.com`,
      username: `crudtest${Date.now()}`,
      password: 'CrudTest123!'
    };

    const response = await request(app)
      .post('/auth/register')
      .send(testData)
      .expect(201);

    testUserToken = response.body.idToken;
    testUserId = response.body.localId;
  });

  afterAll(async () => {
    // Limpiar usuario de prueba
    if (testUserToken) {
      await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);
    }
  });

  describe('1. Obtener Perfil de Usuario', () => {
    it('debe obtener el perfil del usuario autenticado', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('uid', testUserId);
      expect(response.body).toHaveProperty('name', 'CRUD Test User');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('debe obtener perfil de usuario por ID', async () => {
      const response = await request(app)
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('uid', testUserId);
      expect(response.body).toHaveProperty('name', 'CRUD Test User');
    });

    it('debe retornar 404 para usuario inexistente', async () => {
      const fakeUserId = 'fake-user-id-12345';
      const response = await request(app)
        .get(`/users/${fakeUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Usuario no encontrado');
    });
  });

  describe('2. Actualizar Perfil de Usuario', () => {
    it('debe actualizar el nombre del usuario', async () => {
      const updateData = {
        name: 'Updated CRUD User'
      };

      const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated CRUD User');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('debe actualizar el username del usuario', async () => {
      const updateData = {
        username: 'updatedcruduser'
      };

      const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'updatedcruduser');
    });

    it('debe actualizar múltiples campos simultáneamente', async () => {
      const updateData = {
        name: 'Multi Update User',
        username: 'multiupdateuser'
      };

      const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Multi Update User');
      expect(response.body).toHaveProperty('username', 'multiupdateuser');
    });

    it('debe validar campos obligatorios en actualización', async () => {
      const invalidData = {
        name: '', // Nombre vacío
        username: 'ab' // Username muy corto
      };

      const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('3. Cambiar Contraseña', () => {
    it('debe cambiar la contraseña exitosamente', async () => {
      const passwordData = {
        currentPassword: 'CrudTest123!',
        newPassword: 'NewCrudTest123!'
      };

      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('message', 'Contraseña actualizada correctamente');
    });

    it('debe validar que la nueva contraseña sea segura', async () => {
      const weakPasswordData = {
        currentPassword: 'NewCrudTest123!',
        newPassword: 'weak' // Contraseña débil
      };

      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(weakPasswordData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('debe validar campos obligatorios en cambio de contraseña', async () => {
      const incompleteData = {
        currentPassword: 'NewCrudTest123!'
        // newPassword faltante
      };

      const response = await request(app)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('4. Eliminar Usuario', () => {
    it('debe eliminar el usuario exitosamente', async () => {
      const response = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
    });

    it('debe retornar 404 después de eliminar el usuario', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Usuario no encontrado');
    });
  });

  describe('5. Autorización y Seguridad', () => {
    it('debe rechazar acceso sin token de autorización', async () => {
      const response = await request(app)
        .get('/users/me')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('debe rechazar acceso con token inválido', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('debe rechazar acceso con formato de token incorrecto', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
