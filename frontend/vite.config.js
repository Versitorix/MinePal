import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
  },
  define: {
    PROD_BE_HOST: JSON.stringify('https://backend.minepal.net:19999'),
    TEST_BE_HOST: JSON.stringify('http://10.0.0.235:19999'),
    LOCAL_BE_HOST: JSON.stringify('http://localhost:19999')
  },
});

