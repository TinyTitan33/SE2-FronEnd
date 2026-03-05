import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/


export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target: "http://10.150.0.101:5678",
        changeOrigin: true,
        secure: false,

        rewrite: (path) => path.replace(/^\/api/, ""),

    
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("Proxying:", req.url);
            console.log('--- proxy works ---');
           console.log('path:', proxyReq.path);
          });
        },
      },
    },
  },
});

