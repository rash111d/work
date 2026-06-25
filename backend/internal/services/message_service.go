package services

import (
	"strconv"
	"strings"

	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/entities"
	"edumatch/backend/internal/repositories"
)

type MessageService struct {
	store *repositories.Store
}

type MessageInput struct {
	Content string `json:"content"`
}

func NewMessageService(store *repositories.Store) *MessageService {
	return &MessageService{store: store}
}

func (s *MessageService) List(userID, projectID uint, limit int) ([]entities.Message, error) {
	allowed, err := s.store.IsMember(projectID, userID)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, domain.ErrForbidden
	}
	return s.store.MessagesForProject(projectID, limit)
}

func (s *MessageService) Create(userID, projectID uint, input MessageInput) (*entities.Message, []uint, error) {
	content := strings.TrimSpace(input.Content)
	if len(content) < 1 || len(content) > 2000 {
		return nil, nil, domain.ErrValidation
	}
	allowed, err := s.store.IsMember(projectID, userID)
	if err != nil {
		return nil, nil, err
	}
	if !allowed {
		return nil, nil, domain.ErrForbidden
	}
	message := entities.Message{ProjectID: projectID, UserID: userID, Content: content}
	if err := s.store.CreateMessage(&message); err != nil {
		return nil, nil, err
	}
	project, err := s.store.FindProjectByID(projectID)
	if err != nil {
		return nil, nil, err
	}
	recipients := make([]uint, 0, len(project.Members))
	for _, member := range project.Members {
		if member.UserID == userID {
			continue
		}
		recipients = append(recipients, member.UserID)
		_ = s.store.CreateNotification(&entities.Notification{
			UserID: member.UserID,
			Type:   "message_created",
			Title:  "Новое сообщение",
			Body:   "Новое сообщение в проекте " + project.Title,
			Link:   "/projects/" + uintString(projectID) + "/chat",
		})
	}
	fresh, err := s.store.MessagesForProject(projectID, 1)
	if err == nil && len(fresh) > 0 {
		return &fresh[0], recipients, nil
	}
	return &message, recipients, nil
}

func uintString(value uint) string {
	return strconv.FormatUint(uint64(value), 10)
}
