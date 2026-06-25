package services

import (
	"net/mail"
	"strings"
	"time"

	"edumatch/backend/internal/domain"
)

func required(value string, min int) bool {
	return len(strings.TrimSpace(value)) >= min
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func validateEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil && strings.Contains(email, "@")
}

func parseDate(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, domain.ErrValidation
	}
	if parsed, err := time.Parse("2006-01-02", value); err == nil {
		return parsed, nil
	}
	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed, nil
	}
	return time.Time{}, domain.ErrValidation
}

func clamp(value, fallback, min, max int) int {
	if value == 0 {
		return fallback
	}
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}
