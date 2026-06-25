package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv        string
	Port          string
	APIBaseURL    string
	FrontendURL   string
	DatabaseURL   string
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	JWTSecret     string
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
	UploadDir     string
}

func Load() Config {

	_ = godotenv.Load()

	cfg := Config{
		AppEnv:        env("APP_ENV", "development"),
		Port:          env("PORT", "8080"),
		APIBaseURL:    env("API_BASE_URL", "http://localhost:8080"),
		FrontendURL:   env("FRONTEND_URL", "http://localhost:3000"),
		DatabaseURL:   env("DATABASE_URL", "postgres://postgres:123@localhost:5432/edumatch?sslmode=disable"),
		RedisAddr:     env("REDIS_ADDR", "localhost:6379"),
		RedisPassword: env("REDIS_PASSWORD", ""),
		RedisDB:       envInt("REDIS_DB", 0),
		JWTSecret:     env("JWT_SECRET", "local-development-secret-change-me"),
		AccessTTL:     time.Duration(envInt("JWT_ACCESS_TTL_MINUTES", 15)) * time.Minute,
		RefreshTTL:    time.Duration(envInt("JWT_REFRESH_TTL_DAYS", 30)) * 24 * time.Hour,
		UploadDir:     env("UPLOAD_DIR", "uploads"),
	}

	if cfg.AppEnv == "production" && strings.Contains(cfg.JWTSecret, "change-me") {
		log.Fatal("JWT_SECRET must be set to a strong value in production")
	}

	return cfg
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
