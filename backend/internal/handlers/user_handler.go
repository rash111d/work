package handlers

import (
	"path/filepath"
	"strings"

	"edumatch/backend/internal/config"
	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/entities"
	"edumatch/backend/internal/services"
	"edumatch/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	cfg    config.Config
	users  *services.UserService
	skills skillLister
}

type skillLister interface {
	All() ([]entities.Skill, error)
}

func NewUserHandler(cfg config.Config, users *services.UserService, skills skillLister) *UserHandler {
	return &UserHandler{cfg: cfg, users: users, skills: skills}
}

func (h *UserHandler) Me(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	user, err := h.users.Me(userID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	var input services.UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, err)
		return
	}
	user, err := h.users.UpdateProfile(userID, input)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) UploadAvatar(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	file, err := c.FormFile("avatar")
	if err != nil {
		response.Error(c, domain.ErrValidation)
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		response.Error(c, domain.ErrValidation)
		return
	}
	name := uuid.NewString() + ext
	relative := filepath.Join(h.cfg.UploadDir, "avatars", name)
	if err := c.SaveUploadedFile(file, relative); err != nil {
		response.Error(c, err)
		return
	}
	avatarURL := h.cfg.APIBaseURL + "/" + filepath.ToSlash(relative)
	user, err := h.users.UpdateAvatar(userID, avatarURL)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) Search(c *gin.Context) {
	filters := domain.UserFilters{
		Search:     c.Query("search"),
		Skills:     splitQuery(c.Query("skills")),
		Course:     queryInt(c, "course", 0),
		University: c.Query("university"),
		MinRating:  queryFloat(c, "min_rating", 0),
		Sort:       c.DefaultQuery("sort", "rating"),
		Limit:      queryInt(c, "limit", 30),
		Offset:     queryInt(c, "offset", 0),
	}
	users, total, err := h.users.Search(filters)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, gin.H{"items": users, "total": total})
}

func (h *UserHandler) PublicProfile(c *gin.Context) {
	userID, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	user, err := h.users.PublicProfile(userID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) Skills(c *gin.Context) {
	skills, err := h.skills.All()
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, skills)
}
