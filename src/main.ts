import './polyfills';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
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

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    IonicModule.forRoot({ mode: 'ios' })
  ]
}).then(() => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    loading.style.transition = 'opacity 0.3s';
    setTimeout(() => loading.style.display = 'none', 300);
  }
}).catch(err => {
  console.error('Bootstrap error:', err);
  const loading = document.getElementById('loading');
  if (loading) {
    loading.innerHTML = `
      <h1 style="color: #dc2626; margin-top: 24px;">Error al cargar</h1>
      <p style="color: #f87171;">${err.message}</p>
    `;
  }
});
