import '@fontsource/klee-one/japanese-400.css';
import '@fontsource/klee-one/japanese-600.css';
import '@fontsource/klee-one/latin-400.css';
import '@fontsource/klee-one/latin-600.css';
import '@fontsource/zen-kaku-gothic-new/japanese-400.css';
import '@fontsource/zen-kaku-gothic-new/japanese-500.css';
import '@fontsource/zen-kaku-gothic-new/latin-400.css';
import '@fontsource/zen-kaku-gothic-new/latin-500.css';
import './styles/kintsugi.css';
import { KintsugiApp } from './ui/kintsugiApp';

const appRoot = document.getElementById('app');
if (appRoot) {
  new KintsugiApp(appRoot);
}
