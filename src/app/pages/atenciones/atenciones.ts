import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/http-error';
import {
  Atencion,
  Box,
  ESTADOS,
  EstadoAtencion,
  NuevaAtencion,
  Prestacion,
  TRANSICIONES
} from '../../core/models';
import { AtencionesService } from '../../services/atenciones.service';
import { CatalogoService } from '../../services/catalogo.service';

@Component({
  selector: 'app-atenciones',
  imports: [FormsModule, DatePipe],
  templateUrl: './atenciones.html'
})
export class AtencionesPage implements OnInit {

  readonly auth = inject(AuthService);
  private readonly atencionesApi = inject(AtencionesService);
  private readonly catalogoApi = inject(CatalogoService);

  readonly estados = ESTADOS;

  readonly atenciones = signal<Atencion[]>([]);
  readonly prestaciones = signal<Prestacion[]>([]);
  readonly boxes = signal<Box[]>([]);

  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  filtroEstado: EstadoAtencion | '' = '';

  formulario = {
    pacienteEmail: '',
    prestacionId: null as number | null,
    boxId: null as number | null,
    fechaHora: ''
  };

  /** Solo se ofrecen prestaciones activas para agendar. */
  readonly prestacionesActivas = computed(() => this.prestaciones().filter(p => p.activo));
  readonly boxesActivos = computed(() => this.boxes().filter(b => b.activo));

  private readonly nombresPrestacion = computed(
    () => new Map(this.prestaciones().map(p => [p.id, p.nombre]))
  );
  private readonly nombresBox = computed(
    () => new Map(this.boxes().map(b => [b.id, b.nombre]))
  );

  async ngOnInit(): Promise<void> {
    await this.auth.inicializar();
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');

    try {
      // El Paciente no tiene permiso para ver boxes: ni siquiera se consultan
      const [atenciones, prestaciones, boxes] = await Promise.all([
        this.atencionesApi.listar(this.filtroEstado || undefined),
        this.catalogoApi.listarPrestaciones(),
        this.auth.puedeVerBoxes() ? this.catalogoApi.listarBoxes() : Promise.resolve([])
      ]);

      this.atenciones.set(atenciones);
      this.prestaciones.set(prestaciones);
      this.boxes.set(boxes);
    } catch (err) {
      this.error.set(mensajeDeError(err));
    } finally {
      this.cargando.set(false);
    }
  }

  async agendar(): Promise<void> {
    const { pacienteEmail, prestacionId, boxId, fechaHora } = this.formulario;

    if (!prestacionId || !fechaHora || (this.auth.esPersonal() && !pacienteEmail)) {
      this.error.set('Completa todos los campos obligatorios');
      return;
    }

    const nueva: NuevaAtencion = { prestacionId, fechaHora };

    // El Paciente no envía email: el BFF lo toma de su token
    if (this.auth.esPersonal()) {
      nueva.pacienteEmail = pacienteEmail.trim();
      nueva.boxId = boxId;
    }

    await this.ejecutar(async () => {
      const creada = await this.atencionesApi.crear(nueva);
      this.formulario = { pacienteEmail: '', prestacionId: null, boxId: null, fechaHora: '' };
      return `Atención #${creada.id} agendada correctamente`;
    });
  }

  async cambiarEstado(atencion: Atencion, estado: EstadoAtencion): Promise<void> {
    await this.ejecutar(async () => {
      await this.atencionesApi.cambiarEstado(atencion.id, estado);
      return `Atención #${atencion.id} ahora está ${this.etiqueta(estado)}`;
    });
  }

  siguientesEstados(estado: EstadoAtencion): EstadoAtencion[] {
    return TRANSICIONES[estado];
  }

  nombrePrestacion(id: number): string {
    return this.nombresPrestacion().get(id) ?? `Prestación #${id}`;
  }

  nombreBox(id: number | null): string {
    if (id === null) {
      return 'Sin asignar';
    }
    return this.nombresBox().get(id) ?? `Box #${id}`;
  }

  etiqueta(estado: EstadoAtencion): string {
    return estado.replace('_', ' ').toLowerCase();
  }

  /** Ejecuta una acción, muestra el resultado y recarga la lista. */
  private async ejecutar(accion: () => Promise<string>): Promise<void> {
    this.enviando.set(true);
    this.error.set('');
    this.exito.set('');

    try {
      this.exito.set(await accion());
      await this.cargar();
    } catch (err) {
      this.error.set(mensajeDeError(err));
    } finally {
      this.enviando.set(false);
    }
  }
}
