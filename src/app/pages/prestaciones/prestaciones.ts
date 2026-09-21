import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/http-error';
import { NuevaPrestacion, Prestacion } from '../../core/models';
import { CatalogoService } from '../../services/catalogo.service';

@Component({
  selector: 'app-prestaciones',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './prestaciones.html'
})
export class PrestacionesPage implements OnInit {

  readonly auth = inject(AuthService);
  private readonly catalogoApi = inject(CatalogoService);

  readonly prestaciones = signal<Prestacion[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  formulario: NuevaPrestacion = this.formularioVacio();

  async ngOnInit(): Promise<void> {
    await this.auth.inicializar();
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.prestaciones.set(await this.catalogoApi.listarPrestaciones());
    } catch (err) {
      this.error.set(mensajeDeError(err));
    } finally {
      this.cargando.set(false);
    }
  }

  async crear(): Promise<void> {
    if (!this.formulario.nombre.trim() || this.formulario.duracionMinutos <= 0) {
      this.error.set('Nombre y duración son obligatorios');
      return;
    }

    await this.ejecutar(async () => {
      const creada = await this.catalogoApi.crearPrestacion({
        ...this.formulario,
        nombre: this.formulario.nombre.trim()
      });
      this.formulario = this.formularioVacio();
      return `Prestación "${creada.nombre}" creada`;
    });
  }

  /** PUT con los datos completos, cambiando solo el estado activo. */
  async alternarActivo(p: Prestacion): Promise<void> {
    await this.ejecutar(async () => {
      const { id, ...datos } = p;
      await this.catalogoApi.actualizarPrestacion(id, { ...datos, activo: !p.activo });
      return `"${p.nombre}" ahora está ${p.activo ? 'inactiva' : 'activa'}`;
    });
  }

  private formularioVacio(): NuevaPrestacion {
    return { nombre: '', descripcion: '', precio: 0, duracionMinutos: 30, activo: true };
  }

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
