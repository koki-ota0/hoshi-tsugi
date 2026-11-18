import './styles/kintsugi.css';
import { KintsugiApp } from './ui/kintsugiApp';

const appRoot = document.getElementById('app');
if (appRoot) {
  new KintsugiApp(appRoot);
}
