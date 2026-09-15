export enum EstadoEncuesta {
    Borrador = 'Borrador',
    Publicada = 'Publicada',
    Inactiva = 'Inactiva'
}

// Interfaz pura de la Encuesta
export interface Survey {
    id?: string; 
    usuario_creador_id: string;
    item_id: string;
    tipo_encuesta_id: string;
    titulo: string;
    descripcion?: string;
    estado: EstadoEncuesta;
    fecha_creacion?: Date;
    fecha_actualizacion?: Date;
}