package repositories

import (
	"errors"
	"strings"
	"time"

	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/entities"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Store struct {
	db *gorm.DB
}

func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (s *Store) Create(user *entities.User) error {
	return s.db.Create(user).Error
}

func (s *Store) FindByEmail(email string) (*entities.User, error) {
	var user entities.User
	err := s.db.Preload("Skills").Where("LOWER(email) = ?", strings.ToLower(email)).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.ErrNotFound
	}
	return &user, err
}

func (s *Store) FindByID(id uint) (*entities.User, error) {
	var user entities.User
	err := s.db.Preload("Skills").First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.ErrNotFound
	}
	return &user, err
}

func (s *Store) Update(user *entities.User) error {
	return s.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(user).Error
}

func (s *Store) ReplaceUserSkills(user *entities.User, skills []entities.Skill) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(user).Error; err != nil {
			return err
		}
		return tx.Model(user).Association("Skills").Replace(skills)
	})
}

func (s *Store) Search(filters domain.UserFilters) ([]entities.User, int64, error) {
	query := s.db.Model(&entities.User{})
	query = applyUserFilters(query, filters)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var users []entities.User
	err := applyUserSort(query, filters.Sort).
		Preload("Skills").
		Limit(limit(filters.Limit)).
		Offset(offset(filters.Offset)).
		Find(&users).Error
	return users, total, err
}

func (s *Store) All() ([]entities.Skill, error) {
	var skills []entities.Skill
	err := s.db.Order("name ASC").Find(&skills).Error
	return skills, err
}

func (s *Store) FindOrCreate(names []string) ([]entities.Skill, error) {
	normalized := normalizeNames(names)
	skills := make([]entities.Skill, 0, len(normalized))
	for _, name := range normalized {
		skill := entities.Skill{Name: name}
		if err := s.db.Where("LOWER(name) = ?", strings.ToLower(name)).FirstOrCreate(&skill, entities.Skill{Name: name}).Error; err != nil {
			return nil, err
		}
		skills = append(skills, skill)
	}
	return skills, nil
}

func (s *Store) Seed(names []string) error {
	for _, name := range normalizeNames(names) {
		if err := s.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&entities.Skill{Name: name}).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) CreateProject(project *entities.Project) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(project).Error; err != nil {
			return err
		}
		member := entities.ProjectMember{ProjectID: project.ID, UserID: project.OwnerID, Role: entities.MemberRoleCreator}
		return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&member).Error
	})
}

func (s *Store) UpdateProject(project *entities.Project) error {
	return s.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(project).Error
}

func (s *Store) ReplaceProjectStack(project *entities.Project, stack []entities.Skill) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(project).Error; err != nil {
			return err
		}
		return tx.Model(project).Association("Stack").Replace(stack)
	})
}

func (s *Store) Delete(projectID uint) error {
	result := s.db.Delete(&entities.Project{}, projectID)
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return result.Error
}

func (s *Store) FindProjectByID(projectID uint) (*entities.Project, error) {
	var project entities.Project
	err := s.db.
		Preload("Owner.Skills").
		Preload("Stack").
		Preload("Members.User.Skills").
		Preload("Applications.User.Skills").
		First(&project, projectID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.ErrNotFound
	}
	return &project, err
}

func (s *Store) List(filters domain.ProjectFilters) ([]entities.Project, int64, error) {
	query := s.db.Model(&entities.Project{})
	query = applyProjectFilters(query, filters)

	var total int64
	if err := query.Distinct("projects.id").Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var projects []entities.Project
	err := applyProjectSort(query, filters.Sort).
		Preload("Owner.Skills").
		Preload("Stack").
		Preload("Members.User").
		Limit(limit(filters.Limit)).
		Offset(offset(filters.Offset)).
		Find(&projects).Error
	return projects, total, err
}

func (s *Store) ForUser(userID uint) ([]entities.Project, error) {
	var projects []entities.Project
	err := s.db.
		Joins("JOIN project_members ON project_members.project_id = projects.id").
		Where("project_members.user_id = ?", userID).
		Preload("Owner").
		Preload("Stack").
		Preload("Members.User").
		Order("projects.updated_at DESC").
		Find(&projects).Error
	return projects, err
}

func (s *Store) Recommendations(userID uint, skillNames []string, limitValue int) ([]entities.Project, error) {
	var projects []entities.Project
	names := lowerNames(skillNames)
	query := s.db.Model(&entities.Project{}).
		Where("projects.status = ?", entities.ProjectStatusOpen).
		Where("projects.owner_id <> ?", userID).
		Where("NOT EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = ?)", userID).
		Preload("Owner").
		Preload("Stack").
		Preload("Members.User").
		Limit(limit(limitValue))

	if len(names) == 0 {
		return projects, query.Order("projects.created_at DESC").Find(&projects).Error
	}

	return projects, query.
		Select("projects.*, COUNT(skills.id) AS match_score").
		Joins("JOIN project_skills ON project_skills.project_id = projects.id").
		Joins("JOIN skills ON skills.id = project_skills.skill_id").
		Where("LOWER(skills.name) IN ?", names).
		Group("projects.id").
		Order("match_score DESC, projects.created_at DESC").
		Find(&projects).Error
}

func (s *Store) AddMember(projectID, userID uint, role entities.MemberRole) error {
	member := entities.ProjectMember{ProjectID: projectID, UserID: userID, Role: role}
	return s.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&member).Error
}

func (s *Store) IsMember(projectID, userID uint) (bool, error) {
	var count int64
	err := s.db.Model(&entities.ProjectMember{}).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		Count(&count).Error
	return count > 0, err
}

func (s *Store) MemberCount(projectID uint) (int64, error) {
	var count int64
	err := s.db.Model(&entities.ProjectMember{}).Where("project_id = ?", projectID).Count(&count).Error
	return count, err
}

func (s *Store) CreateApplication(app *entities.Application) error {
	return s.db.Create(app).Error
}

func (s *Store) UpdateApplication(app *entities.Application) error {
	return s.db.Save(app).Error
}

func (s *Store) FindApplicationByID(id uint) (*entities.Application, error) {
	var app entities.Application
	err := s.db.Preload("Project.Owner").Preload("Project.Stack").Preload("User.Skills").First(&app, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.ErrNotFound
	}
	return &app, err
}

func (s *Store) FindByProjectAndUser(projectID, userID uint) (*entities.Application, error) {
	var app entities.Application
	err := s.db.Where("project_id = ? AND user_id = ?", projectID, userID).First(&app).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.ErrNotFound
	}
	return &app, err
}

func (s *Store) ApplicationsForUser(userID uint) ([]entities.Application, error) {
	var apps []entities.Application
	err := s.db.
		Where("user_id = ?", userID).
		Preload("Project.Owner").
		Preload("Project.Stack").
		Preload("User").
		Order("created_at DESC").
		Find(&apps).Error
	return apps, err
}

func (s *Store) Incoming(ownerID uint) ([]entities.Application, error) {
	var apps []entities.Application
	err := s.db.
		Joins("JOIN projects ON projects.id = applications.project_id").
		Where("projects.owner_id = ?", ownerID).
		Preload("Project.Owner").
		Preload("Project.Stack").
		Preload("User.Skills").
		Order("applications.created_at DESC").
		Find(&apps).Error
	return apps, err
}

func (s *Store) StatsForUser(userID uint) (int64, int64, int64, error) {
	var pending, accepted, rejected int64
	base := s.db.Model(&entities.Application{}).Where("user_id = ?", userID)
	if err := base.Where("status = ?", entities.ApplicationStatusPending).Count(&pending).Error; err != nil {
		return 0, 0, 0, err
	}
	if err := s.db.Model(&entities.Application{}).Where("user_id = ? AND status = ?", userID, entities.ApplicationStatusAccepted).Count(&accepted).Error; err != nil {
		return 0, 0, 0, err
	}
	if err := s.db.Model(&entities.Application{}).Where("user_id = ? AND status = ?", userID, entities.ApplicationStatusRejected).Count(&rejected).Error; err != nil {
		return 0, 0, 0, err
	}
	return pending, accepted, rejected, nil
}

func (s *Store) CreateMessage(message *entities.Message) error {
	return s.db.Create(message).Error
}

func (s *Store) MessagesForProject(projectID uint, limitValue int) ([]entities.Message, error) {
	var messages []entities.Message
	err := s.db.
		Where("project_id = ?", projectID).
		Preload("User.Skills").
		Order("created_at DESC").
		Limit(limit(limitValue)).
		Find(&messages).Error
	if err != nil {
		return nil, err
	}
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	return messages, nil
}

func (s *Store) CreateNotification(notification *entities.Notification) error {
	return s.db.Create(notification).Error
}

func (s *Store) NotificationsForUser(userID uint, limitValue int) ([]entities.Notification, error) {
	var notifications []entities.Notification
	err := s.db.
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit(limitValue)).
		Find(&notifications).Error
	return notifications, err
}

func (s *Store) UnreadCount(userID uint) (int64, error) {
	var count int64
	err := s.db.Model(&entities.Notification{}).
		Where("user_id = ? AND read = false", userID).
		Count(&count).Error
	return count, err
}

func (s *Store) MarkRead(userID, notificationID uint) error {
	result := s.db.Model(&entities.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("read", true)
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return result.Error
}

func (s *Store) MarkAllRead(userID uint) error {
	return s.db.Model(&entities.Notification{}).
		Where("user_id = ? AND read = false", userID).
		Update("read", true).Error
}

func (s *Store) CreateSession(session *entities.RefreshSession) error {
	return s.db.Create(session).Error
}

func (s *Store) FindSessionByHash(hash string) (*entities.RefreshSession, error) {
	var session entities.RefreshSession
	err := s.db.Where("token_hash = ?", hash).First(&session).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.ErrNotFound
	}
	return &session, err
}

func (s *Store) Revoke(hash string, revokedAt time.Time) error {
	return s.db.Model(&entities.RefreshSession{}).
		Where("token_hash = ? AND revoked_at IS NULL", hash).
		Update("revoked_at", revokedAt).Error
}

func applyUserFilters(query *gorm.DB, filters domain.UserFilters) *gorm.DB {
	if filters.Search != "" {
		term := "%" + strings.ToLower(filters.Search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(university) LIKE ?", term, term, term)
	}
	if filters.Course > 0 {
		query = query.Where("course = ?", filters.Course)
	}
	if filters.University != "" {
		query = query.Where("LOWER(university) LIKE ?", "%"+strings.ToLower(filters.University)+"%")
	}
	if filters.MinRating > 0 {
		query = query.Where("rating >= ?", filters.MinRating)
	}
	if len(filters.Skills) > 0 {
		query = query.
			Joins("JOIN user_skills ON user_skills.user_id = users.id").
			Joins("JOIN skills ON skills.id = user_skills.skill_id").
			Where("LOWER(skills.name) IN ?", lowerNames(filters.Skills)).
			Group("users.id")
	}
	return query
}

func applyProjectFilters(query *gorm.DB, filters domain.ProjectFilters) *gorm.DB {
	if filters.Search != "" {
		term := "%" + strings.ToLower(filters.Search) + "%"
		query = query.Where("LOWER(projects.title) LIKE ? OR LOWER(projects.description) LIKE ?", term, term)
	}
	if filters.Status != "" {
		query = query.Where("projects.status = ?", filters.Status)
	}
	if len(filters.Stack) > 0 {
		query = query.
			Joins("JOIN project_skills ON project_skills.project_id = projects.id").
			Joins("JOIN skills ON skills.id = project_skills.skill_id").
			Where("LOWER(skills.name) IN ?", lowerNames(filters.Stack)).
			Group("projects.id")
	}
	return query
}

func applyUserSort(query *gorm.DB, sort string) *gorm.DB {
	switch sort {
	case "rating":
		return query.Order("users.rating DESC")
	case "course":
		return query.Order("users.course ASC")
	case "newest":
		return query.Order("users.created_at DESC")
	default:
		return query.Order("users.rating DESC").Order("users.name ASC")
	}
}

func applyProjectSort(query *gorm.DB, sort string) *gorm.DB {
	switch sort {
	case "deadline":
		return query.Order("deadline ASC")
	case "newest":
		return query.Order("projects.created_at DESC")
	case "status":
		return query.Order("status ASC, deadline ASC")
	default:
		return query.Order("projects.updated_at DESC")
	}
}

func normalizeNames(names []string) []string {
	seen := map[string]bool{}
	result := make([]string, 0, len(names))
	for _, name := range names {
		clean := strings.TrimSpace(name)
		if clean == "" {
			continue
		}
		key := strings.ToLower(clean)
		if seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, clean)
	}
	return result
}

func lowerNames(names []string) []string {
	result := make([]string, 0, len(names))
	for _, name := range normalizeNames(names) {
		result = append(result, strings.ToLower(name))
	}
	return result
}

func limit(value int) int {
	if value <= 0 || value > 100 {
		return 30
	}
	return value
}

func offset(value int) int {
	if value < 0 {
		return 0
	}
	return value
}
