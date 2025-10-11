package http

import (
	"log"
	"net/http"

	"github.com/caorushizi/mediago-player/assets"
	"github.com/caorushizi/mediago-player/internal/http/middleware"
	"github.com/caorushizi/mediago-player/internal/video"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Config controls router features
type Config struct {
	// VideoRootPath is the local filesystem directory to scan and stream videos from
	VideoRootPath string
	// ServerAddr is the server address (e.g., ":8080") used for generating video URLs
	ServerAddr string
}

// New creates router with default config (no video routes)
func New() *gin.Engine { return NewWithConfig(Config{}) }

// NewWithConfig creates router with provided config
func NewWithConfig(cfg Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())
	r.Use(middleware.RequestID())
	r.Use(middleware.CORS())

	// Health & readiness
	r.GET("/healthz", func(c *gin.Context) { c.String(http.StatusOK, "ok") })
	r.GET("/readyz", func(c *gin.Context) { c.String(http.StatusOK, "ready") })

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Versioned API
	api := r.Group("/api")
	{
		v1 := api.Group("/v1")

		// Video API routes (only if video directory is configured)
		if cfg.VideoRootPath != "" {
			videoService, err := video.NewService(cfg.VideoRootPath, cfg.ServerAddr)
			if err != nil {
				log.Printf("[video] failed to initialize video service: %v", err)
			} else {
				videoHandler := video.NewHandler(videoService)
				// Keep versioned API
				videoHandler.RegisterRoutes(v1)

				// Video file serving route
				r.GET("/videos/*filepath", video.ServeVideo(cfg.VideoRootPath))
			}
		} else {
			// No video directory configured: still expose endpoints returning empty list for compatibility
			v1.GET("/videos", func(c *gin.Context) {
				c.JSON(http.StatusOK, []video.Video{})
			})
		}
	}

	// Exclude API/health paths from SPA handling
	excludePrefixes := []string{"/api/", "/healthz", "/readyz", "/swagger/", "/videos/"}

	// Static files - Mobile SPA (/m)
	r.Use(NewSPAHandler(SPAConfig{
		FS:              assets.FS,
		Root:            "mobile",
		PathPrefix:      "/m",
		ExcludePrefixes: excludePrefixes,
	}))

	// Static files - Desktop SPA (default)
	r.Use(NewSPAHandler(SPAConfig{
		FS:              assets.FS,
		Root:            "desktop",
		ExcludePrefixes: excludePrefixes,
	}))

	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
	})

	return r
}
