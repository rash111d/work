package handlers

import (
	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/services"
	"edumatch/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type ProjectHandler struct {
	projects *services.ProjectService
	messages *services.MessageService
}

func NewProjectHandler(projects *services.ProjectService, messages *services.MessageService) *ProjectHandler {
	return &ProjectHandler{projects: projects, messages: messages}
}

func (h *ProjectHandler) List(c *gin.Context) {
	filters := domain.ProjectFilters{
		Search: c.Query("search"),
		Stack:  splitQuery(c.Query("stack")),
		Status: c.Query("status"),
		Sort:   c.DefaultQuery("sort", "updated"),
		Limit:  queryInt(c, "limit", 30),
		Offset: queryInt(c, "offset", 0),
	}
	projects, total, err := h.projects.List(filters)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, gin.H{"items": projects, "total": total})
}

func (h *ProjectHandler) Create(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	var input services.ProjectInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, err)
		return
	}
	project, err := h.projects.Create(userID, input)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, project)
}

func (h *ProjectHandler) Get(c *gin.Context) {
	projectID, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	project, err := h.projects.Get(projectID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, project)
}

func (h *ProjectHandler) Update(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	projectID, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	var input services.ProjectInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, err)
		return
	}
	project, err := h.projects.Update(userID, projectID, input)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, project)
}

func (h *ProjectHandler) Delete(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	projectID, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	if err := h.projects.Delete(userID, projectID); err != nil {
		response.Error(c, err)
		return
	}
	response.NoContent(c)
}

func (h *ProjectHandler) Apply(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	projectID, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	var input services.ApplyInput
	_ = c.ShouldBindJSON(&input)
	app, err := h.projects.Apply(userID, projectID, input)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, app)
}

func (h *ProjectHandler) MyProjects(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	projects, err := h.projects.MyProjects(userID)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, projects)
}

func (h *ProjectHandler) Recommendations(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	projects, err := h.projects.Recommendations(userID, queryInt(c, "limit", 8))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, projects)
}

func (h *ProjectHandler) Messages(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	projectID, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	messages, err := h.messages.List(userID, projectID, queryInt(c, "limit", 100))
	if err != nil {
		response.Error(c, err)
		return
	}
	response.OK(c, messages)
}

func (h *ProjectHandler) CreateMessage(c *gin.Context) {
	userID, err := currentUserID(c)
	if err != nil {
		response.Error(c, err)
		return
	}
	projectID, err := paramID(c, "id")
	if err != nil {
		response.Error(c, err)
		return
	}
	var input services.MessageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.Error(c, err)
		return
	}
	message, _, err := h.messages.Create(userID, projectID, input)
	if err != nil {
		response.Error(c, err)
		return
	}
	response.Created(c, message)
}
