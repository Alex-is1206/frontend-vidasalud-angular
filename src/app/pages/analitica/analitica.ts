import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, filter, switchMap, timer } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/http-error';
import { ESTADOS, HistorialEntrada, ResumenAnalitica } from '../../core/models';
import { AnaliticaService } from '../../services/analitica.service';

/** Cada cuánto se vuelve a pedir el resumen. */
const INTERVALO_MS = 5000;

/**
 * Panel de analítica en tiempo real.
 *
 * Cada 5 segundos pide /api/analitica/resumen. Cuando alguien crea o cambia
 * una atención, appointments publica el evento en Kafka, analytics lo consume
 * y actualiza sus métricas, y el panel lo muestra en el siguiente ciclo sin
 * recargar la página. Los valores que cambiaron se resaltan un instante.
 */
@Component({
  selector: 'app-analitica',
  imports: [FormsModule, DatePipe],
  templateUrl: './analitica.html'
})
export class AnaliticaPage implements OnInit {

  readonly auth = inject(AuthService);
  private readonly api = inject(AnaliticaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly intervaloSegundos = INTERVALO_MS / 1000;
  readonly resumen = signal<ResumenAnalitica | null>(null);
  readonly error = signal('');
  readonly enVivo = signal(true);
  readonly ultimaActualizacion = signal<Date | null>(null);
  /** Nombres de los indicadores que cambiaron en la última actualización. */
  readonly cambiados = signal<Set<string>>(new Set());

  /** Consulta del historial de una atención. */
  atencionBuscada: number | null = null;
  readonly historial = signal<HistorialEntrada[] | null>(null);
  readonly errorHistorial = signal('');
  readonly buscando = signal(false);

  /** Filas de la distribución por estado, en el orden del ciclo de vida. */
  readonly porEstado = computed(() => {
    const r = this.resumen();
    if (!r) {
      return [];
    }
    const max = Math.max(1, ...Object.values(r.atencionesPorEstado));
    return ESTADOS.map(estado => {
      const cantidad = r.atencionesPorEstado[estado] ?? 0;
      return { estado, cantidad, ancho: (cantidad / max) * 100 };
    });
  });

  /** Reparto de eventos entre las 3 particiones del tópico. */
  readonly porParticion = computed(() => {
    const r = this.resumen();
    if (!r) {
      return [];
    }
    const total = Math.max(1, Object.values(r.eventosPorParticion).reduce((a, b) => a + b, 0));
    return [0, 1, 2].map(p => {
      const cantidad = r.eventosPorParticion[p] ?? 0;
      return { particion: p, cantidad, ancho: (cantidad / total) * 100 };
    });
  });

  async ngOnInit(): Promise<void> {
    await this.auth.inicializar();

    timer(0, INTERVALO_MS)
      .pipe(
        filter(() => this.enVivo()),
        // switchMap: si una respuesta tarda más de 5 s, se descarta y se pide de nuevo
        switchMap(() => this.api.resumen().pipe(
          catchError((err: HttpErrorResponse) => {
            this.error.set(mensajeDeError(err));
            return EMPTY;
          }))),
        takeUntilDestroyed(this.destroyRef))
      .subscribe(nuevo => this.aplicar(nuevo));
  }

  alternarEnVivo(): void {
    this.enVivo.update(v => !v);
  }

  cambio(indicador: string): boolean {
    return this.cambiados().has(indicador);
  }

  async buscarHistorial(): Promise<void> {
    if (!this.atencionBuscada || this.atencionBuscada <= 0) {
      this.errorHistorial.set('Ingresa el número de una atención');
      return;
    }
    this.buscando.set(true);
    this.errorHistorial.set('');
    this.historial.set(null);
    try {
      this.historial.set(await this.api.historial(this.atencionBuscada));
    } catch (err) {
      this.errorHistorial.set(mensajeDeError(err));
    } finally {
      this.buscando.set(false);
    }
  }

  private aplicar(nuevo: ResumenAnalitica): void {
    const anterior = this.resumen();
    this.error.set('');
    this.resumen.set(nuevo);
    this.ultimaActualizacion.set(new Date());

    if (!anterior) {
      return;
    }
    const cambiados = new Set<string>();
    const comparar = (nombre: string, a: unknown, b: unknown) => {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        cambiados.add(nombre);
      }
    };
    comparar('total', anterior.totalAtenciones, nuevo.totalAtenciones);
    comparar('minuto', anterior.confirmacionesUltimoMinuto, nuevo.confirmacionesUltimoMinuto);
    comparar('hora', anterior.confirmacionesUltimaHora, nuevo.confirmacionesUltimaHora);
    comparar('boxes', [anterior.boxesActivos, anterior.boxesTotales], [nuevo.boxesActivos, nuevo.boxesTotales]);
    comparar('eventos', anterior.eventosProcesados, nuevo.eventosProcesados);
    comparar('ultimo', anterior.ultimoEvento?.eventId, nuevo.ultimoEvento?.eventId);
    for (const estado of ESTADOS) {
      comparar(estado, anterior.atencionesPorEstado[estado], nuevo.atencionesPorEstado[estado]);
    }
    this.cambiados.set(cambiados);

    // El resaltado dura poco más de un segundo
    if (cambiados.size > 0) {
      setTimeout(() => this.cambiados.set(new Set()), 1500);
    }
  }
}
