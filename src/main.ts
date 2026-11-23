import '@fontsource/zen-old-mincho/japanese-400.css';
import '@fontsource/zen-old-mincho/japanese-600.css';
import '@fontsource/zen-old-mincho/latin-400.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import './styles/kintsugi.css';
import { KintsugiApp } from './ui/kintsugiApp';

const appRoot = document.getElementById('app');
if (appRoot) {
  new KintsugiApp(appRoot);
}
