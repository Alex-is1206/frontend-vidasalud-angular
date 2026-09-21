import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/http-error';
import { Box, NuevoBox } from '../../core/models';
import { CatalogoService } from '../../services/catalogo.service';

@Component({
  selector: 'app-boxes',
  imports: [FormsModule],
  templateUrl: './boxes.html'
})
export class BoxesPage implements OnInit {

  readonly auth = inject(AuthService);
  private readonly catalogoApi = inject(CatalogoService);

  readonly boxes = signal<Box[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  formulario: NuevoBox = { nombre: '', capacidad: 1, activo: true };

  async ngOnInit(): Promise<void> {
    await this.auth.inicializar();
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.boxes.set(await this.catalogoApi.listarBoxes());
    } catch (err) {
      this.error.set(mensajeDeError(err));
    } finally {
      this.cargando.set(false);
    }
  }

  async crear(): Promise<void> {
    if (!this.formulario.nombre.trim() || this.formulario.capacidad <= 0) {
      this.error.set('Nombre y capacidad son obligatorios');
      return;
    }

    await this.ejecutar(async () => {
      const creado = await this.catalogoApi.crearBox({
        ...this.formulario,
        nombre: this.formulario.nombre.trim()
      });
      this.formulario = { nombre: '', capacidad: 1, activo: true };
      return `Box "${creado.nombre}" creado`;
    });
  }

  async alternarActivo(b: Box): Promise<void> {
    await this.ejecutar(async () => {
      const { id, ...datos } = b;
      await this.catalogoApi.actualizarBox(id, { ...datos, activo: !b.activo });
      return `"${b.nombre}" ahora está ${b.activo ? 'inactivo' : 'activo'}`;
    });
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
