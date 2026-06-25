package services

import (
	"strings"

	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/entities"
	"edumatch/backend/internal/repositories"
)

type UserService struct {
	store *repositories.Store
}

type UpdateProfileInput struct {
	Name       string   `json:"name"`
	Bio        string   `json:"bio"`
	University string   `json:"university"`
	Course     int      `json:"course"`
	City       string   `json:"city"`
	AvatarURL  string   `json:"avatar_url"`
	Skills     []string `json:"skills"`
}

func NewUserService(store *repositories.Store) *UserService {
	return &UserService{store: store}
}

func (s *UserService) Me(userID uint) (*entities.User, error) {
	return s.store.FindByID(userID)
}

func (s *UserService) UpdateProfile(userID uint, input UpdateProfileInput) (*entities.User, error) {
	if !required(input.Name, 2) || input.Course < 1 || input.Course > 6 {
		return nil, domain.ErrValidation
	}
	user, err := s.store.FindByID(userID)
	if err != nil {
		return nil, err
	}
	user.Name = strings.TrimSpace(input.Name)
	user.Bio = strings.TrimSpace(input.Bio)
	user.University = strings.TrimSpace(input.University)
	user.Course = input.Course
	user.City = strings.TrimSpace(input.City)
	if input.AvatarURL != "" {
		user.AvatarURL = input.AvatarURL
	}
	skills, err := s.store.FindOrCreate(input.Skills)
	if err != nil {
		return nil, err
	}
	if err := s.store.ReplaceUserSkills(user, skills); err != nil {
		return nil, err
	}
	return s.store.FindByID(userID)
}

func (s *UserService) UpdateAvatar(userID uint, avatarURL string) (*entities.User, error) {
	user, err := s.store.FindByID(userID)
	if err != nil {
		return nil, err
	}
	user.AvatarURL = avatarURL
	if err := s.store.Update(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) Search(filters domain.UserFilters) ([]entities.User, int64, error) {
	return s.store.Search(filters)
}

func (s *UserService) PublicProfile(userID uint) (*entities.User, error) {
	return s.store.FindByID(userID)
}
