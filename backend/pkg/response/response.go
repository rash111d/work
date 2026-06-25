package response

import (
	"errors"
	"net/http"

	"edumatch/backend/internal/domain"
	"github.com/gin-gonic/gin"
)

type ErrorBody struct {
	Error string `json:"error"`
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, data)
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, data)
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func Error(c *gin.Context, err error) {
	status := http.StatusInternalServerError
	message := "internal server error"

	switch {
	case errors.Is(err, domain.ErrUnauthorized):
		status = http.StatusUnauthorized
		message = err.Error()
	case errors.Is(err, domain.ErrForbidden):
		status = http.StatusForbidden
		message = err.Error()
	case errors.Is(err, domain.ErrNotFound):
		status = http.StatusNotFound
		message = err.Error()
	case errors.Is(err, domain.ErrConflict):
		status = http.StatusConflict
		message = err.Error()
	case errors.Is(err, domain.ErrValidation):
		status = http.StatusBadRequest
		message = err.Error()
	case errors.Is(err, domain.ErrInvalidCredentials):
		status = http.StatusUnauthorized
		message = err.Error()
	default:
		if err != nil && err.Error() != "" {
			message = err.Error()
		}
	}

	c.JSON(status, ErrorBody{Error: message})
}
