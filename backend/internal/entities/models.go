package entities

import (
	"time"

	"gorm.io/gorm"
)

type ProjectStatus string

const (
	ProjectStatusOpen       ProjectStatus = "open"
	ProjectStatusInProgress ProjectStatus = "in_progress"
	ProjectStatusCompleted  ProjectStatus = "completed"
	ProjectStatusArchived   ProjectStatus = "archived"
)

type ApplicationStatus string

const (
	ApplicationStatusPending  ApplicationStatus = "pending"
	ApplicationStatusAccepted ApplicationStatus = "accepted"
	ApplicationStatusRejected ApplicationStatus = "rejected"
)

type MemberRole string

const (
	MemberRoleCreator MemberRole = "creator"
	MemberRoleMember  MemberRole = "member"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"size:120;not null" json:"name"`
	Email        string         `gorm:"size:160;uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"size:255;not null" json:"-"`
	AvatarURL    string         `gorm:"size:500" json:"avatar_url"`
	Bio          string         `gorm:"type:text" json:"bio"`
	University   string         `gorm:"size:160;index" json:"university"`
	Course       int            `gorm:"index" json:"course"`
	City         string         `gorm:"size:120" json:"city"`
	Rating       float64        `gorm:"type:decimal(3,2);default:5" json:"rating"`
	Skills       []Skill        `gorm:"many2many:user_skills;" json:"skills"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type Skill struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:80;uniqueIndex;not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Project struct {
	ID           uint            `gorm:"primaryKey" json:"id"`
	OwnerID      uint            `gorm:"index;not null" json:"owner_id"`
	Owner        User            `json:"owner"`
	Title        string          `gorm:"size:160;not null;index" json:"title"`
	Description  string          `gorm:"type:text;not null" json:"description"`
	Format       string          `gorm:"size:80;default:Online" json:"format"`
	Deadline     time.Time       `gorm:"index" json:"deadline"`
	Status       ProjectStatus   `gorm:"size:40;default:open;index" json:"status"`
	Capacity     int             `gorm:"default:5" json:"capacity"`
	Stack        []Skill         `gorm:"many2many:project_skills;" json:"stack"`
	Members      []ProjectMember `json:"members"`
	Applications []Application   `json:"applications,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	DeletedAt    gorm.DeletedAt  `gorm:"index" json:"-"`
}

type ProjectMember struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	ProjectID uint       `gorm:"uniqueIndex:idx_project_member;not null" json:"project_id"`
	UserID    uint       `gorm:"uniqueIndex:idx_project_member;not null" json:"user_id"`
	Role      MemberRole `gorm:"size:40;not null" json:"role"`
	User      User       `json:"user"`
	Project   Project    `json:"project,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type Application struct {
	ID        uint              `gorm:"primaryKey" json:"id"`
	ProjectID uint              `gorm:"uniqueIndex:idx_project_application;not null" json:"project_id"`
	UserID    uint              `gorm:"uniqueIndex:idx_project_application;not null" json:"user_id"`
	Status    ApplicationStatus `gorm:"size:40;default:pending;index" json:"status"`
	Message   string            `gorm:"type:text" json:"message"`
	Project   Project           `json:"project"`
	User      User              `json:"user"`
	CreatedAt time.Time         `json:"created_at"`
	UpdatedAt time.Time         `json:"updated_at"`
}

type Message struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProjectID uint      `gorm:"index;not null" json:"project_id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	User      User      `json:"user"`
	Project   Project   `json:"project,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Type      string    `gorm:"size:80;index;not null" json:"type"`
	Title     string    `gorm:"size:180;not null" json:"title"`
	Body      string    `gorm:"type:text;not null" json:"body"`
	Link      string    `gorm:"size:300" json:"link"`
	Read      bool      `gorm:"default:false;index" json:"read"`
	CreatedAt time.Time `json:"created_at"`
}

type RefreshSession struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"index;not null" json:"user_id"`
	TokenHash string     `gorm:"size:255;uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time  `gorm:"index;not null" json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at"`
	CreatedAt time.Time  `json:"created_at"`
}

type Favorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex:idx_favorite;not null" json:"user_id"`
	ProjectID uint      `gorm:"uniqueIndex:idx_favorite;not null" json:"project_id"`
	Project   Project   `json:"project"`
	CreatedAt time.Time `json:"created_at"`
}
