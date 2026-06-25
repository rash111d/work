package handlers

import (
	"edumatch/backend/internal/services"
	"edumatch/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboard *services.DashboardService
}

func NewDashboardHandler(dashboard *services.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboard: dashboard}
}

func (h *DashboardHandler) Get(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	result, err := h.dashboard.Get(userID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, result)
}
