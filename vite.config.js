import { defineConfig } from "vite";
import { resolve } from "path"; 
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "login.html"),
                menu: resolve(__dirname, "menu.html"),
                users: resolve(__dirname, "users.html"),
                messages: resolve(__dirname, "messages.html")
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