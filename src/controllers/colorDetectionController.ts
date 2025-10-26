import type { Request, Response } from "express";
import { z } from "zod";
import { firestore } from "../services/firebase";
import type { AuthedRequest } from "../middlewares/auth";

// Esquemas de validación
const saveColorDetectionSchema = z.object({
  colorName: z.string().min(1, "El nombre del color es requerido"),
  colorCategory: z.string().min(1, "La categoría del color es requerida"),
  rgb: z.array(z.number()).length(3, "RGB debe tener exactamente 3 valores"),
  hex: z.string().min(1, "El valor hexadecimal es requerido"),
  hsl: z.array(z.number()).length(3, "HSL debe tener exactamente 3 valores"),
  confidence: z.number().min(0).max(100, "La confianza debe estar entre 0 y 100"),
  palette: z.array(z.object({
    name: z.string(),
    category: z.string(),
    rgb: z.array(z.number()).length(3),
    percentage: z.number().min(0).max(100)
  })).optional()
});

const saveRecommendationsSchema = z.object({
  colorName: z.string().min(1, "El nombre del color es requerido"),
  colorCategory: z.string().min(1, "La categoría del color es requerida"),
  recommendations: z.array(z.object({
    strategy: z.string().min(1, "La estrategia es requerida"),
    description: z.string().min(1, "La descripción es requerida"),
    tips: z.array(z.string()).min(1, "Debe haber al menos un consejo")
  })).min(1, "Debe haber al menos una recomendación")
});

/**
 * Guarda una detección de color en Firebase
 */
export async function saveColorDetection(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const data = saveColorDetectionSchema.parse(req.body);

    console.log('🎨 Guardando detección de color para usuario:', userId);
    console.log('📊 Datos de detección:', data);

    // Crear el documento de detección
    const colorDetectionData = {
      userId,
      colorName: data.colorName,
      colorCategory: data.colorCategory,
      rgb: data.rgb,
      hex: data.hex,
      hsl: data.hsl,
      confidence: data.confidence,
      palette: data.palette || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Guardar en Firebase
    const docRef = await firestore.collection('colorDetections').add(colorDetectionData);
    
    console.log('✅ Detección de color guardada con ID:', docRef.id);

    return res.status(201).json({
      success: true,
      detectionId: docRef.id,
      message: "Detección de color guardada exitosamente"
    });

  } catch (error: any) {
    console.error('❌ Error guardando detección de color:', error);
    
    // Manejar errores de validación de Zod
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: error.errors[0]?.message || "Datos de detección inválidos",
        code: "VALIDATION_ERROR" 
      });
    }
    
    return res.status(500).json({ 
      error: "Error interno del servidor guardando detección",
      code: "SAVE_DETECTION_ERROR" 
    });
  }
}

/**
 * Guarda recomendaciones de IA en Firebase
 */
export async function saveRecommendations(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const data = saveRecommendationsSchema.parse(req.body);

    console.log('🤖 Guardando recomendaciones para usuario:', userId);
    console.log('📊 Datos de recomendaciones:', data);

    // Crear el documento de recomendaciones
    const recommendationData = {
      userId,
      colorName: data.colorName,
      colorCategory: data.colorCategory,
      recommendations: data.recommendations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Guardar en Firebase
    const docRef = await firestore.collection('recommendations').add(recommendationData);
    
    console.log('✅ Recomendaciones guardadas con ID:', docRef.id);

    return res.status(201).json({
      success: true,
      recommendationId: docRef.id,
      message: "Recomendaciones guardadas exitosamente"
    });

  } catch (error: any) {
    console.error('❌ Error guardando recomendaciones:', error);
    
    // Manejar errores de validación de Zod
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: error.errors[0]?.message || "Datos de recomendaciones inválidos",
        code: "VALIDATION_ERROR" 
      });
    }
    
    return res.status(500).json({ 
      error: "Error interno del servidor guardando recomendaciones",
      code: "SAVE_RECOMMENDATIONS_ERROR" 
    });
  }
}

/**
 * Obtiene el historial de detecciones de colores del usuario
 */
export async function getColorDetectionHistory(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log('📚 Obteniendo historial de detecciones para usuario:', userId);
    
    const query = firestore.collection('colorDetections')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    
    const colorHistory = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      colorHistory,
      total: colorHistory.length,
      message: "Historial de detecciones obtenido exitosamente"
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo historial de detecciones:', error);
    
    return res.status(500).json({ 
      error: "Error interno del servidor obteniendo historial",
      code: "HISTORY_ERROR" 
    });
  }
}

/**
 * Obtiene el historial de recomendaciones del usuario
 */
export async function getRecommendationHistory(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log('📚 Obteniendo historial de recomendaciones para usuario:', userId);
    
    const query = firestore.collection('recommendations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    
    const recommendationHistory = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      recommendationHistory,
      total: recommendationHistory.length,
      message: "Historial de recomendaciones obtenido exitosamente"
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo historial de recomendaciones:', error);
    
    return res.status(500).json({ 
      error: "Error interno del servidor obteniendo historial",
      code: "HISTORY_ERROR" 
    });
  }
}

/**
 * Obtiene una detección específica por ID
 */
export async function getColorDetectionById(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    console.log('🔍 Obteniendo detección específica:', id);
    
    const doc = await firestore.collection('colorDetections').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        error: "Detección de color no encontrada",
        code: "DETECTION_NOT_FOUND" 
      });
    }

    const data = doc.data()!;
    
    // Verificar que la detección pertenece al usuario
    if (data.userId !== userId) {
      return res.status(403).json({ 
        error: "No tienes permisos para acceder a esta detección",
        code: "ACCESS_DENIED" 
      });
    }

    return res.status(200).json({
      success: true,
      detection: {
        id: doc.id,
        ...data
      },
      message: "Detección obtenida exitosamente"
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo detección específica:', error);
    
    return res.status(500).json({ 
      error: "Error interno del servidor",
      code: "DETECTION_ERROR" 
    });
  }
}

/**
 * Elimina una detección específica
 */
export async function deleteColorDetection(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    console.log('🗑️ Eliminando detección:', id);
    
    const doc = await firestore.collection('colorDetections').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        error: "Detección de color no encontrada",
        code: "DETECTION_NOT_FOUND" 
      });
    }

    const data = doc.data()!;
    
    // Verificar que la detección pertenece al usuario
    if (data.userId !== userId) {
      return res.status(403).json({ 
        error: "No tienes permisos para eliminar esta detección",
        code: "ACCESS_DENIED" 
      });
    }

    await firestore.collection('colorDetections').doc(id).delete();
    
    console.log('✅ Detección eliminada exitosamente');

    return res.status(200).json({
      success: true,
      message: "Detección eliminada exitosamente"
    });

  } catch (error: any) {
    console.error('❌ Error eliminando detección:', error);
    
    return res.status(500).json({ 
      error: "Error interno del servidor",
      code: "DELETE_ERROR" 
    });
  }
}
