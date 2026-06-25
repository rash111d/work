package config

import (
	"context"
	"log"
	"time"

	"edumatch/backend/internal/entities"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ConnectDatabase(cfg Config) (*gorm.DB, error) {
	logLevel := logger.Warn
	if cfg.AppEnv == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

func ConnectRedis(ctx context.Context, cfg Config) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	if err := client.Ping(ctx).Err(); err != nil {
		log.Println("Redis is not running. Continuing without Redis...")
		return nil, nil
	}

	return client, nil
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&entities.User{},
		&entities.Skill{},
		&entities.Project{},
		&entities.ProjectMember{},
		&entities.Application{},
		&entities.Message{},
		&entities.Notification{},
		&entities.RefreshSession{},
		&entities.Favorite{},
	)
}
