import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Products } from './components/products/products';
import { ProductDetails } from './components/product-details/product-details';
import { AddProduct } from './components/add-product/add-product';
import { Orders } from './components/orders/orders';
import { Profile } from './components/profile/profile';
import { AdminDashboard } from './components/admin/admin';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'products', component: Products },
  { path: 'products/new', component: AddProduct },
  { path: 'products/:id', component: ProductDetails },
  { path: 'orders', component: Orders },
  { path: 'profile', component: Profile },
  { path: 'admin', component: AdminDashboard },
  { path: 'product-list', redirectTo: 'products', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '**', component: NotFound }
];
