package services

import (
	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/entities"
	"edumatch/backend/internal/repositories"
)

type ApplicationService struct {
	store *repositories.Store
}

func NewApplicationService(store *repositories.Store) *ApplicationService {
	return &ApplicationService{store: store}
}

func (s *ApplicationService) Mine(userID uint) ([]entities.Application, error) {
	return s.store.ApplicationsForUser(userID)
}

func (s *ApplicationService) Incoming(userID uint) ([]entities.Application, error) {
	return s.store.Incoming(userID)
}

func (s *ApplicationService) ChangeStatus(ownerID, applicationID uint, status entities.ApplicationStatus) (*entities.Application, error) {
	if status != entities.ApplicationStatusAccepted && status != entities.ApplicationStatusRejected {
		return nil, domain.ErrValidation
	}
	app, err := s.store.FindApplicationByID(applicationID)
	if err != nil {
		return nil, err
	}
	if app.Project.OwnerID != ownerID {
		return nil, domain.ErrForbidden
	}
	if app.Status != entities.ApplicationStatusPending {
		return nil, domain.ErrConflict
	}
	if status == entities.ApplicationStatusAccepted {
		count, err := s.store.MemberCount(app.ProjectID)
		if err != nil {
			return nil, err
		}
		if int(count) >= app.Project.Capacity {
			return nil, domain.ErrConflict
		}
		if err := s.store.AddMember(app.ProjectID, app.UserID, entities.MemberRoleMember); err != nil {
			return nil, err
		}
	}
	app.Status = status
	if err := s.store.UpdateApplication(app); err != nil {
		return nil, err
	}
	notification := entities.Notification{
		UserID: app.UserID,
		Link:   "/applications",
	}
	if status == entities.ApplicationStatusAccepted {
		notification.Type = "application_accepted"
		notification.Title = "Заявка принята"
		notification.Body = "Ваша заявка в проект " + app.Project.Title + " принята"
	} else {
		notification.Type = "application_rejected"
		notification.Title = "Заявка отклонена"
		notification.Body = "Ваша заявка в проект " + app.Project.Title + " отклонена"
	}
	_ = s.store.CreateNotification(&notification)
	return s.store.FindApplicationByID(applicationID)
}
