package routes

import (
	"time"

	"edumatch/backend/internal/config"
	"edumatch/backend/internal/handlers"
	"edumatch/backend/internal/middleware"
	"edumatch/backend/internal/services"
	"edumatch/backend/internal/ws"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Handlers struct {
	Auth          *handlers.AuthHandler
	Users         *handlers.UserHandler
	Projects      *handlers.ProjectHandler
	Applications  *handlers.ApplicationHandler
	Dashboard     *handlers.DashboardHandler
	Notifications *handlers.NotificationHandler
	Hub           *ws.Hub
	AuthService   *services.AuthService
}

func NewRouter(cfg config.Config, h Handlers) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL, "http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.Static("/uploads", cfg.UploadDir)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	router.GET("/ws/projects/:id", h.Hub.HandleProjectSocket)

	api := router.Group("/api/v1")
	api.GET("/skills", h.Users.Skills)
	api.POST("/auth/register", h.Auth.Register)
	api.POST("/auth/login", h.Auth.Login)
	api.POST("/auth/refresh", h.Auth.Refresh)
	api.POST("/auth/logout", h.Auth.Logout)

	protected := api.Group("")
	protected.Use(middleware.Auth(h.AuthService))
	protected.GET("/dashboard", h.Dashboard.Get)
	protected.GET("/users/me", h.Users.Me)
	protected.PUT("/users/me", h.Users.UpdateMe)
	protected.POST("/users/me/avatar", h.Users.UploadAvatar)
	protected.GET("/users", h.Users.Search)
	protected.GET("/users/:id", h.Users.PublicProfile)

	protected.GET("/projects", h.Projects.List)
	protected.POST("/projects", h.Projects.Create)
	protected.GET("/projects/mine", h.Projects.MyProjects)
	protected.GET("/projects/recommended", h.Projects.Recommendations)
	protected.GET("/projects/:id", h.Projects.Get)
	protected.PUT("/projects/:id", h.Projects.Update)
	protected.DELETE("/projects/:id", h.Projects.Delete)
	protected.POST("/projects/:id/applications", h.Projects.Apply)
	protected.GET("/projects/:id/messages", h.Projects.Messages)
	protected.POST("/projects/:id/messages", h.Projects.CreateMessage)

	protected.GET("/applications/mine", h.Applications.Mine)
	protected.GET("/applications/incoming", h.Applications.Incoming)
	protected.PATCH("/applications/:id/status", h.Applications.ChangeStatus)

	protected.GET("/notifications", h.Notifications.List)
	protected.PATCH("/notifications/read-all", h.Notifications.MarkAllRead)
	protected.PATCH("/notifications/:id/read", h.Notifications.MarkRead)

	return router
}
