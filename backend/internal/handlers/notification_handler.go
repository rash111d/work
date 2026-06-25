package handlers

import (
	"edumatch/backend/internal/repositories"
	"edumatch/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	store *repositories.Store
}

func NewNotificationHandler(store *repositories.Store) *NotificationHandler {
	return &NotificationHandler{store: store}
}

func (h *NotificationHandler) List(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	notifications, err := h.store.NotificationsForUser(userID, queryInt(c, "limit", 30))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, notifications)
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	id, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	if err := h.store.MarkRead(userID, id); err != nil {
		response.Error(c, err)
		return
	}
	response.NoContent(c)
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	if err := h.store.MarkAllRead(userID); err != nil {
		response.Error(c, err)
		return
	}
	response.NoContent(c)
}
