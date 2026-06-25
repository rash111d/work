package handlers

import (
	"edumatch/backend/internal/services"
	"edumatch/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input services.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, err)
		return
	}
	result, err := h.service.Register(c.Request.Context(), input)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, result)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input services.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, err)
		return
	}
	result, err := h.service.Login(c.Request.Context(), input)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, result)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var input struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, err)
		return
	}
	result, err := h.service.Refresh(c.Request.Context(), input.RefreshToken)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, result)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var input struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&input)
	if err := h.service.Logout(c.Request.Context(), input.RefreshToken); err != nil {
		response.Error(c, err)
		return
	}
	response.NoContent(c)
}
