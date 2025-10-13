package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/caorushizi/mediago-player/docs"
	router "github.com/caorushizi/mediago-player/internal/http"
	"github.com/caorushizi/mediago-player/internal/util"
	"github.com/gin-gonic/gin"
)

// @title           MediaGo Player API
// @version         1.0
// @description     MediaGo Player backend API for managing and streaming video files
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/v1

// @schemes http https

func main() {
	// Read config from env/flags
	defaultAddr := getEnv("HTTP_ADDR", "0.0.0.0:8080")
	mode := getEnv("GIN_MODE", "release") // "debug" / "release" / "test"
	defaultVideoRoot := os.Getenv("VIDEO_ROOT_PATH")

	// Command-line flags
	host := flag.String("host", "", "Server host address (default: 0.0.0.0 or from HTTP_ADDR)")
	port := flag.String("port", "", "Server port (default: 8080 or from HTTP_ADDR)")
	videoRoot := flag.String("video-root", defaultVideoRoot, "Local folder path containing video files")
	enableDocs := flag.Bool("enable-docs", false, "Enable Swagger API documentation at /docs (disabled by default in production)")
	flag.Parse()

	// Build final address from flags or env
	addr := buildAddr(*host, *port, defaultAddr)
	gin.SetMode(mode)

	// Determine if Swagger should be enabled
	// Enable in debug mode by default, or when explicitly requested
	swaggerEnabled := mode == "debug" || *enableDocs

	// Build gin.Engine
	r := router.NewWithConfig(router.Config{
		VideoRootPath: *videoRoot,
		ServerAddr:    addr,
		EnableSwagger: swaggerEnabled,
	})

	srv := &http.Server{
		Addr:              addr,
		Handler:           r,
		ReadTimeout:       10 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Start HTTP
	go func() {
		log.Printf("[http] listening on %s (mode=%s)\n", addr, mode)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[http] listen: %v\n", err)
		}
	}()

	// Graceful shutdown
	util.GracefulShutdown(func(ctx context.Context) error {
		log.Println("[http] shutting down ...")
		return srv.Shutdown(ctx)
	})
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// buildAddr constructs the server address from host, port flags and default address
// Priority: command-line flags > HTTP_ADDR env > hardcoded default (0.0.0.0:8080)
func buildAddr(host, port, defaultAddr string) string {
	// If both host and port are provided via flags, use them
	if host != "" && port != "" {
		return host + ":" + port
	}

	// If only port is provided, extract host from defaultAddr or use 0.0.0.0
	if port != "" {
		h := "0.0.0.0"
		if defaultAddr != "" {
			// Try to extract host from defaultAddr (format: "host:port" or ":port")
			if idx := len(defaultAddr) - 1; idx >= 0 {
				for i := 0; i < len(defaultAddr); i++ {
					if defaultAddr[i] == ':' {
						if i > 0 {
							h = defaultAddr[:i]
						}
						break
					}
				}
			}
		}
		return h + ":" + port
	}

	// If only host is provided, extract port from defaultAddr or use 8080
	if host != "" {
		p := "8080"
		if defaultAddr != "" {
			// Try to extract port from defaultAddr (format: "host:port" or ":port")
			for i := len(defaultAddr) - 1; i >= 0; i-- {
				if defaultAddr[i] == ':' {
					p = defaultAddr[i+1:]
					break
				}
			}
		}
		return host + ":" + p
	}

	// No flags provided, use defaultAddr
	return defaultAddr
}
