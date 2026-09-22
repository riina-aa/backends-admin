import { defineConfig } from "vite";
import { resolve } from "path"; 
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(import.meta.dirname, "index.html"),
                menu: resolve(import.meta.dirname, "menu.html"),
                users: resolve(import.meta.dirname, "users.html"),
                messages: resolve(import.meta.dirname, "messages.html")
            }
        }
    },

    plugins: [
        ViteImageOptimizer({
            png: {
                quality: 75
            },
            jpg: {
                quality: 75
            },
            jpeg: {
                quality: 75
            }, 
            webp: {
                quality: 70
            },
            avif: {
                quality: 60
            }
        })
    ]
})