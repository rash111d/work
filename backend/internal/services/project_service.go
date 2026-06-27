package services

import (
	"errors"
	"strings"
	"time"

	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/entities"
	"edumatch/backend/internal/repositories"
)

type ProjectService struct {
	store *repositories.Store
}

type ProjectInput struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Format      string   `json:"format"`
	Deadline    string   `json:"deadline"`
	Status      string   `json:"status"`
	Capacity    int      `json:"capacity"`
	Stack       []string `json:"stack"`
}

type ApplyInput struct {
	Message string `json:"message"`
}

func NewProjectService(store *repositories.Store) *ProjectService {
	return &ProjectService{store: store}
}

func (s *ProjectService) Create(userID uint, input ProjectInput) (*entities.Project, error) {
	project, stack, err := s.projectFromInput(userID, nil, input)
	if err != nil {
		return nil, err
	}
	project.Stack = stack
	if err := s.store.CreateProject(project); err != nil {
		return nil, err
	}
	return s.store.FindProjectByID(project.ID)
}

func (s *ProjectService) Update(userID, projectID uint, input ProjectInput) (*entities.Project, error) {
	project, err := s.store.FindProjectByID(projectID)
	if err != nil {
		return nil, err
	}
	if project.OwnerID != userID {
		return nil, domain.ErrForbidden
	}
	updated, stack, err := s.projectFromInput(userID, project, input)
	if err != nil {
		return nil, err
	}
	if err := s.store.ReplaceProjectStack(updated, stack); err != nil {
		return nil, err
	}
	return s.store.FindProjectByID(projectID)
}

func (s *ProjectService) Delete(userID, projectID uint) error {
	project, err := s.store.FindProjectByID(projectID)
	if err != nil {
		return err
	}
	if project.OwnerID != userID {
		return domain.ErrForbidden
	}
	return s.store.Delete(projectID)
}

func (s *ProjectService) Get(projectID uint) (*entities.Project, error) {
	return s.store.FindProjectByID(projectID)
}

func (s *ProjectService) List(filters domain.ProjectFilters) ([]entities.Project, int64, error) {
	return s.store.List(filters)
}

func (s *ProjectService) MyProjects(userID uint) ([]entities.Project, error) {
	return s.store.ForUser(userID)
}

func (s *ProjectService) Recommendations(userID uint, limit int) ([]entities.Project, error) {
	user, err := s.store.FindByID(userID)
	if err != nil {
		return nil, err
	}
	skills := make([]string, 0, len(user.Skills))
	for _, skill := range user.Skills {
		skills = append(skills, skill.Name)
	}
	return s.store.Recommendations(userID, skills, limit)
}

func (s *ProjectService) Apply(userID, projectID uint, input ApplyInput) (*entities.Application, error) {
	project, err := s.store.FindProjectByID(projectID)
	if err != nil {
		return nil, err
	}
	if project.OwnerID == userID {
		return nil, domain.ErrConflict
	}
	if project.Status == entities.ProjectStatusCompleted || project.Status == entities.ProjectStatusArchived {
		return nil, domain.ErrConflict
	}
	isMember, err := s.store.IsMember(projectID, userID)
	if err != nil {
		return nil, err
	}
	if isMember {
		return nil, domain.ErrConflict
	}
	count, err := s.store.MemberCount(projectID)
	if err != nil {
		return nil, err
	}
	if int(count) >= project.Capacity {
		return nil, domain.ErrConflict
	}
	if _, err := s.store.FindByProjectAndUser(projectID, userID); err == nil {
		return nil, domain.ErrConflict
	} else if !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}
	app := entities.Application{
		ProjectID: projectID,
		UserID:    userID,
		Status:    entities.ApplicationStatusPending,
		Message:   strings.TrimSpace(input.Message),
	}
	if err := s.store.CreateApplication(&app); err != nil {
		return nil, err
	}
	user, _ := s.store.FindByID(userID)
	title := "Новая заявка"
	body := "Пользователь отправил заявку в проект " + project.Title
	if user != nil {
		body = user.Name + " отправил заявку в проект " + project.Title
	}
	_ = s.store.CreateNotification(&entities.Notification{
		UserID: project.OwnerID,
		Type:   "application_created",
		Title:  title,
		Body:   body,
		Link:   "/applications",
	})
	return s.store.FindApplicationByID(app.ID)
}

func (s *ProjectService) projectFromInput(userID uint, current *entities.Project, input ProjectInput) (*entities.Project, []entities.Skill, error) {
	if !required(input.Title, 3) || !required(input.Description, 20) || len(input.Stack) == 0 {
		return nil, nil, domain.ErrValidation
	}
	deadline, err := parseDate(input.Deadline)
	if err != nil {
		return nil, nil, err
	}
	if deadline.Before(timeToday()) {
		return nil, nil, domain.ErrValidation
	}
	status := entities.ProjectStatusOpen
	if input.Status != "" {
		status = entities.ProjectStatus(input.Status)
	}
	if status != entities.ProjectStatusOpen &&
		status != entities.ProjectStatusInProgress &&
		status != entities.ProjectStatusCompleted &&
		status != entities.ProjectStatusArchived {
		return nil, nil, domain.ErrValidation
	}
	capacity := clamp(input.Capacity, 5, 2, 30)
	format := strings.TrimSpace(input.Format)
	if format == "" {
		format = "Online"
	}
	stack, err := s.store.FindOrCreate(input.Stack)
	if err != nil {
		return nil, nil, err
	}
	project := current
	if project == nil {
		project = &entities.Project{OwnerID: userID}
	}
	project.Title = strings.TrimSpace(input.Title)
	project.Description = strings.TrimSpace(input.Description)
	project.Format = format
	project.Deadline = deadline
	project.Status = status
	project.Capacity = capacity
	return project, stack, nil
}

func timeToday() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
}
