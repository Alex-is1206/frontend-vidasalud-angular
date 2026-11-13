/** Contratos de datos que devuelve el BFF (mismos que los microservicios). */

export type EstadoAtencion =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'EN_ESPERA'
  | 'EN_ATENCION'
  | 'CERRADA'
  | 'CANCELADA';

export interface Atencion {
  id: number;
  pacienteEmail: string;
  prestacionId: number;
  boxId: number | null;
  fechaHora: string;
  estado: EstadoAtencion;
}

export interface NuevaAtencion {
  /** Solo lo envía el personal; al Paciente el BFF se lo asigna desde el token. */
  pacienteEmail?: string;
  prestacionId: number;
  boxId?: number | null;
  fechaHora: string;
}

export interface Prestacion {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracionMinutos: number;
  activo: boolean;
}

export type NuevaPrestacion = Omit<Prestacion, 'id'>;

export interface Box {
  id: number;
  nombre: string;
  capacidad: number;
  activo: boolean;
}

export type NuevoBox = Omit<Box, 'id'>;

/** Respuesta de GET /api/me: lo que el BFF leyó del token validado. */
export interface Perfil {
  name: string;
  username: string;
  subject: string;
  issuer: string;
  audience: string[];
  roles: string[];
  scopes: string[];
  expiresAt: string;
}

/** Máquina de estados: la misma que valida ms-vidasalud-appointments. */
export const TRANSICIONES: Record<EstadoAtencion, EstadoAtencion[]> = {
  SOLICITADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_ESPERA', 'CANCELADA'],
  EN_ESPERA: ['EN_ATENCION', 'CANCELADA'],
  EN_ATENCION: ['CERRADA'],
  CERRADA: [],
  CANCELADA: []
};

export const ESTADOS: EstadoAtencion[] = Object.keys(TRANSICIONES) as EstadoAtencion[];

/* ---------- Analítica en tiempo real (ms-vidasalud-analytics, vía BFF) ---------- */

/** Último evento de atención que procesó el consumidor de Kafka. */
export interface UltimoEvento {
  eventId: string;
  tipo: 'ATENCION_CREADA' | 'ESTADO_CAMBIADO';
  atencionId: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  ocurridoEn: string;
  particion: number;
  offset: number;
  hilo: string;
  procesadoEn: string;
}

/** Respuesta de GET /api/analitica/resumen. */
export interface ResumenAnalitica {
  totalAtenciones: number;
  atencionesPorEstado: Record<string, number>;
  confirmacionesUltimoMinuto: number;
  confirmacionesUltimaHora: number;
  atencionesPorPrestacion: Record<string, number>;
  boxesTotales: number;
  boxesActivos: number;
  capacidadActiva: number;
  eventosProcesados: number;
  duplicadosIgnorados: number;
  eventosPorParticion: Record<string, number>;
  ultimoEvento: UltimoEvento | null;
  generadoEn: string;
}

/** Un punto de la línea de tiempo de una atención (tabla HISTORIAL_ATENCION). */
export interface HistorialEntrada {
  eventId: string;
  tipo: string;
  atencionId: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  boxId: number | null;
  ocurridoEn: string;
  procesadoEn: string;
  particion: number;
  offset: number;
}
