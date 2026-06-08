import './polyfills';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { AppComponent } from './app.component';

import { PosPage } from './pages/pos/pos.page';
import { PedidosPage } from './pages/pedidos/pedidos.page';
import { PedidoDetailPage } from './pages/pedido-detail/pedido-detail.page';
import { HistorialPage } from './pages/historial/historial.page';
import { EstadisticasPage } from './pages/estadisticas/estadisticas.page';
import { InventarioPage } from './pages/inventario/inventario.page';

const routes: Routes = [
  { path: '', redirectTo: '/pos', pathMatch: 'full' },
  { path: 'pos', component: PosPage },
  { path: 'pedidos', component: PedidosPage },
  { path: 'pedidos/:id', component: PedidoDetailPage },
  { path: 'historial', component: HistorialPage },
  { path: 'estadisticas', component: EstadisticasPage },
  { path: 'inventario', component: InventarioPage }
];

enableProdMode();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    {
      provide: IonicModule,
      useFactory: () => IonicModule.forRoot({ mode: 'ios' })
    }
  ]
}).catch(err => console.error(err));
