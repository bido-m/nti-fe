import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Products } from './components/products/products';
import { ProductDetails } from './components/product-details/product-details';
import { AddProduct } from './components/add-product/add-product';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'products', component: Products },
  { path: 'products/new', component: AddProduct },
  { path: 'products/:id', component: ProductDetails },
  { path: 'product-list', redirectTo: 'products', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '**', component: NotFound }
];
