package handlers

import (
	"strconv"
	"strings"

	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func currentUserID(c *gin.Context) (uint, error) {
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		return 0, domain.ErrUnauthorized
	}
	return userID, nil
}

func paramID(c *gin.Context, name string) (uint, error) {
	value := c.Param(name)
	parsed, err := strconv.ParseUint(value, 10, 64)
	if err != nil || parsed == 0 {
		return 0, domain.ErrValidation
	}
	return uint(parsed), nil
}

func queryInt(c *gin.Context, name string, fallback int) int {
	value := strings.TrimSpace(c.Query(name))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func queryFloat(c *gin.Context, name string, fallback float64) float64 {
	value := strings.TrimSpace(c.Query(name))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return fallback
	}
	return parsed
}

func splitQuery(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		clean := strings.TrimSpace(part)
		if clean != "" {
			result = append(result, clean)
		}
	}
	return result
}
