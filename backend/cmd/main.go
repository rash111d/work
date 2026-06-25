package main

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"edumatch/backend/internal/config"
	"edumatch/backend/internal/handlers"
	"edumatch/backend/internal/repositories"
	"edumatch/backend/internal/routes"
	"edumatch/backend/internal/services"
	"edumatch/backend/internal/ws"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()

	if err := os.MkdirAll(filepath.Join(cfg.UploadDir, "avatars"), 0o755); err != nil {
		log.Fatalf("create upload directory: %v", err)
	}

	db, err := config.ConnectDatabase(cfg)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}

	if err := config.AutoMigrate(db); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	redisClient, err := config.ConnectRedis(ctx, cfg)
	if err != nil {
		log.Fatalf("connect redis: %v", err)
	}

	_, err = config.ConnectRedis(ctx, cfg)
	if err != nil {
		log.Println("Redis is not running. Continuing without Redis...")
	} else {
		log.Println("Redis connected.")
	}

	store := repositories.NewStore(db)

	if err := store.Seed(defaultSkills()); err != nil {
		log.Fatalf("seed skills: %v", err)
	}

	authService := services.NewAuthService(cfg, store, redisClient)
	userService := services.NewUserService(store)
	projectService := services.NewProjectService(store)
	applicationService := services.NewApplicationService(store)
	messageService := services.NewMessageService(store)
	dashboardService := services.NewDashboardService(store, projectService)

	hub := ws.NewHub(authService, messageService)

	router := routes.NewRouter(cfg, routes.Handlers{
		Auth:          handlers.NewAuthHandler(authService),
		Users:         handlers.NewUserHandler(cfg, userService, store),
		Projects:      handlers.NewProjectHandler(projectService, messageService),
		Applications:  handlers.NewApplicationHandler(applicationService),
		Dashboard:     handlers.NewDashboardHandler(dashboardService),
		Notifications: handlers.NewNotificationHandler(store),
		Hub:           hub,
		AuthService:   authService,
	})

	log.Printf("EduMatch API listening on :%s", cfg.Port)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

func defaultSkills() []string {
	return []string{
		"React",
		"Next.js",
		"TypeScript",
		"Node.js",
		"Go",
		"Gin",
		"Python",
		"Django",
		"Java",
		"Spring Boot",
		"C++",
		"C#",
		"PostgreSQL",
		"Redis",
		"Docker",
		"Kubernetes",
		"Figma",
		"UI/UX",
		"Machine Learning",
		"Data Science",
		"Mobile",
		"Flutter",
		"Firebase",
		"GraphQL",
	}
}
