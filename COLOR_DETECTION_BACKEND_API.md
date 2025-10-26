# API de Detección de Colores con Backend

## Descripción
Esta API permite guardar las detecciones de colores y recomendaciones generadas en el frontend directamente en Firebase a través del backend. El sistema mantiene la funcionalidad local del frontend pero añade persistencia de datos por usuario.

## Flujo de Funcionamiento

1. **Frontend**: El usuario toma una foto y se detectan colores localmente
2. **Frontend**: Se obtienen recomendaciones de IA localmente
3. **Frontend**: Los datos se envían al backend para guardar en Firebase
4. **Backend**: Valida y guarda los datos en las colecciones de Firebase
5. **Usuario**: Puede acceder a su historial personal de detecciones y recomendaciones

## Endpoints

### 1. Guardar Detección de Color
**POST** `/color-detection/save-detection`

Guarda los datos de una detección de color en Firebase.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "colorName": "Rojo Manzana",
  "colorCategory": "Rojo",
  "rgb": [255, 59, 48],
  "hex": "#FF3B30",
  "hsl": [3, 100, 59],
  "confidence": 85,
  "palette": [
    {
      "name": "Rojo Manzana",
      "category": "Rojo",
      "rgb": [255, 59, 48],
      "percentage": 60
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "detectionId": "firebase-doc-id",
  "message": "Detección de color guardada exitosamente"
}
```

### 2. Guardar Recomendaciones
**POST** `/color-detection/save-recommendations`

Guarda las recomendaciones de IA en Firebase.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "colorName": "Rojo Manzana",
  "colorCategory": "Rojo",
  "recommendations": [
    {
      "strategy": "Uso de contexto y patrones",
      "description": "Identifica el color basándote en su contexto...",
      "tips": [
        "Observa el entorno donde aparece el color",
        "Busca patrones o formas que te ayuden a identificarlo"
      ]
    }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "recommendationId": "firebase-doc-id",
  "message": "Recomendaciones guardadas exitosamente"
}
```

### 3. Historial de Detecciones
**GET** `/color-detection/history?limit=20&offset=0`

Obtiene el historial de detecciones del usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (opcional): Número de resultados (default: 20)
- `offset` (opcional): Desplazamiento (default: 0)

**Respuesta:**
```json
{
  "success": true,
  "colorHistory": [
    {
      "id": "doc-id",
      "userId": "user-id",
      "colorName": "Rojo Manzana",
      "colorCategory": "Rojo",
      "rgb": [255, 59, 48],
      "hex": "#FF3B30",
      "hsl": [3, 100, 59],
      "confidence": 85,
      "palette": [...],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "message": "Historial de detecciones obtenido exitosamente"
}
```

### 4. Historial de Recomendaciones
**GET** `/color-detection/recommendations/history?limit=20&offset=0`

Obtiene el historial de recomendaciones del usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (opcional): Número de resultados (default: 20)
- `offset` (opcional): Desplazamiento (default: 0)

### 5. Obtener Detección Específica
**GET** `/color-detection/detection/:id`

Obtiene una detección específica por ID.

**Headers:**
```
Authorization: Bearer <token>
```

### 6. Eliminar Detección
**DELETE** `/color-detection/detection/:id`

Elimina una detección específica.

**Headers:**
```
Authorization: Bearer <token>
```

## Estructura de Datos en Firebase

### Colección: `colorDetections`
```json
{
  "userId": "string",
  "colorName": "string",
  "colorCategory": "string",
  "rgb": [number, number, number],
  "hex": "string",
  "hsl": [number, number, number],
  "confidence": "number",
  "palette": [
    {
      "name": "string",
      "category": "string",
      "rgb": [number, number, number],
      "percentage": "number"
    }
  ],
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### Colección: `recommendations`
```json
{
  "userId": "string",
  "colorName": "string",
  "colorCategory": "string",
  "recommendations": [
    {
      "strategy": "string",
      "description": "string",
      "tips": ["string"]
    }
  ],
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

## Uso en el Frontend

### Servicio Integrado
El frontend ahora incluye `colorDetectionWithBackendService` que:

1. Detecta colores localmente
2. Obtiene recomendaciones de IA localmente
3. Guarda ambos datos en el backend automáticamente
4. Maneja errores de conexión gracefully

### Ejemplo de Uso
```typescript
import { colorDetectionWithBackendService } from '../services/colorDetectionWithBackend';

// Detectar y guardar automáticamente
const result = await colorDetectionWithBackendService.detectAndSaveColors(imageUri);

console.log('Color detectado:', result.detectionResult.dominantColor.name);
console.log('Guardado con ID:', result.detectionId);
console.log('Recomendaciones:', result.recommendations.length);
```

### Funciones Disponibles
- `detectAndSaveColors(imageUri)`: Detecta y guarda todo automáticamente
- `getColorDetectionHistory(limit, offset)`: Obtiene historial de detecciones
- `getRecommendationHistory(limit, offset)`: Obtiene historial de recomendaciones
- `getColorDetectionById(id)`: Obtiene detección específica
- `deleteColorDetection(id)`: Elimina detección específica
- `detectColorsOnly(imageUri)`: Solo detecta (sin guardar)
- `getRecommendationsOnly(colorName, category)`: Solo obtiene recomendaciones (sin guardar)

## Códigos de Error

- `VALIDATION_ERROR`: Datos de entrada inválidos
- `SAVE_DETECTION_ERROR`: Error guardando detección
- `SAVE_RECOMMENDATIONS_ERROR`: Error guardando recomendaciones
- `HISTORY_ERROR`: Error obteniendo historial
- `DETECTION_NOT_FOUND`: Detección no encontrada
- `ACCESS_DENIED`: Sin permisos para acceder al recurso
- `DELETE_ERROR`: Error eliminando recurso

## Testing

```bash
cd Back_Daltocomp
npm test -- color-detection-backend.test.ts
```

## Ventajas del Sistema

1. **Funcionalidad Offline**: La detección local sigue funcionando sin conexión
2. **Persistencia**: Los datos se guardan automáticamente cuando hay conexión
3. **Historial Personal**: Cada usuario puede acceder a sus detecciones anteriores
4. **Escalabilidad**: El backend puede manejar múltiples usuarios
5. **Robustez**: Maneja errores de conexión sin afectar la funcionalidad local
6. **Flexibilidad**: Permite usar solo detección local o con guardado automático
