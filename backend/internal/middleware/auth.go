package middleware

import (
	"strings"

	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/services"
	"edumatch/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

const userIDKey = "userID"

func Auth(auth *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Error(c, domain.ErrUnauthorized)
			c.Abort()
			return
		}
		claims, err := auth.ValidateAccessToken(parts[1])
		if err != nil {
			response.Error(c, err)
			c.Abort()
			return
		}
		c.Set(userIDKey, claims.UserID)
		c.Next()
	}
}

func CurrentUserID(c *gin.Context) (uint, bool) {
	value, exists := c.Get(userIDKey)
	if !exists {
		return 0, false
	}
	userID, ok := value.(uint)
	return userID, ok
}
