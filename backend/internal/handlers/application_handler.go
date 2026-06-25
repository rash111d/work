package handlers

import (
	"edumatch/backend/internal/entities"
	"edumatch/backend/internal/services"
	"edumatch/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type ApplicationHandler struct {
	apps *services.ApplicationService
}

func NewApplicationHandler(apps *services.ApplicationService) *ApplicationHandler {
	return &ApplicationHandler{apps: apps}
}

func (h *ApplicationHandler) Mine(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	apps, err := h.apps.Mine(userID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, apps)
}

func (h *ApplicationHandler) Incoming(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	apps, err := h.apps.Incoming(userID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, apps)
}

func (h *ApplicationHandler) ChangeStatus(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	appID, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	var input struct {
		Status entities.ApplicationStatus `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, err)
		return
	}
	app, err := h.apps.ChangeStatus(userID, appID, input.Status)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, app)
}
