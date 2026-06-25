package domain

import (
	"time"

	"edumatch/backend/internal/entities"
)

type ProjectFilters struct {
	Search string
	Stack  []string
	Status string
	Sort   string
	Limit  int
	Offset int
}

type UserFilters struct {
	Search     string
	Skills     []string
	Course     int
	University string
	MinRating  float64
	Sort       string
	Limit      int
	Offset     int
}

type UserRepository interface {
	Create(user *entities.User) error
	FindByEmail(email string) (*entities.User, error)
	FindByID(id uint) (*entities.User, error)
	Update(user *entities.User) error
	Search(filters UserFilters) ([]entities.User, int64, error)
}

type SkillRepository interface {
	All() ([]entities.Skill, error)
	FindOrCreate(names []string) ([]entities.Skill, error)
	Seed(names []string) error
}

type ProjectRepository interface {
	Create(project *entities.Project) error
	Update(project *entities.Project) error
	Delete(projectID uint) error
	FindByID(projectID uint) (*entities.Project, error)
	List(filters ProjectFilters) ([]entities.Project, int64, error)
	ForUser(userID uint) ([]entities.Project, error)
	Recommendations(userID uint, skillNames []string, limit int) ([]entities.Project, error)
	AddMember(projectID, userID uint, role entities.MemberRole) error
	IsMember(projectID, userID uint) (bool, error)
	MemberCount(projectID uint) (int64, error)
}

type ApplicationRepository interface {
	Create(app *entities.Application) error
	Update(app *entities.Application) error
	FindByID(id uint) (*entities.Application, error)
	FindByProjectAndUser(projectID, userID uint) (*entities.Application, error)
	ForUser(userID uint) ([]entities.Application, error)
	Incoming(ownerID uint) ([]entities.Application, error)
	StatsForUser(userID uint) (pending int64, accepted int64, rejected int64, err error)
}

type MessageRepository interface {
	Create(message *entities.Message) error
	ForProject(projectID uint, limit int) ([]entities.Message, error)
}

type NotificationRepository interface {
	Create(notification *entities.Notification) error
	ForUser(userID uint, limit int) ([]entities.Notification, error)
	UnreadCount(userID uint) (int64, error)
	MarkRead(userID, notificationID uint) error
	MarkAllRead(userID uint) error
}

type RefreshRepository interface {
	Create(session *entities.RefreshSession) error
	FindByHash(hash string) (*entities.RefreshSession, error)
	Revoke(hash string, revokedAt time.Time) error
}
