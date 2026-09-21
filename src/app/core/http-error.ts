import { HttpErrorResponse } from '@angular/common/http';

interface CuerpoDeError {
  message?: string;
  mensaje?: string;
  campos?: Record<string, string>;
}

/**
 * Convierte cualquier error HTTP en un mensaje legible.
 * Entiende los dos formatos del backend: el del BFF (message)
 * y el de los microservicios (mensaje, campos).
 */
export function mensajeDeError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado';
  }

  if (err.status === 0) {
    return 'No se pudo conectar con el servidor';
  }

  const cuerpo: CuerpoDeError | null =
    err.error && typeof err.error === 'object' ? (err.error as CuerpoDeError) : null;

  if (cuerpo?.campos) {
    const detalle = Object.entries(cuerpo.campos)
      .map(([campo, problema]) => `${campo}: ${problema}`)
      .join(', ');
    return `${err.status} · Datos inválidos (${detalle})`;
  }

  return `${err.status} · ${cuerpo?.message ?? cuerpo?.mensaje ?? err.statusText}`;
}
