package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"time"

	"edumatch/backend/internal/config"
	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/entities"
	"edumatch/backend/internal/repositories"

	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	cfg   config.Config
	store *repositories.Store
	redis *redis.Client
}

type RegisterInput struct {
	Name       string   `json:"name"`
	Email      string   `json:"email"`
	Password   string   `json:"password"`
	University string   `json:"university"`
	Course     int      `json:"course"`
	Skills     []string `json:"skills"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken  string        `json:"access_token"`
	RefreshToken string        `json:"refresh_token"`
	User         entities.User `json:"user"`
}

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func NewAuthService(cfg config.Config, store *repositories.Store, redis *redis.Client) *AuthService {
	return &AuthService{cfg: cfg, store: store, redis: redis}
}

func (s *AuthService) Register(ctx context.Context, input RegisterInput) (*AuthResponse, error) {
	email := normalizeEmail(input.Email)
	if !required(input.Name, 2) || !validateEmail(email) || len(input.Password) < 8 || input.Course < 1 || input.Course > 6 {
		return nil, domain.ErrValidation
	}

	if _, err := s.store.FindByEmail(email); err == nil {
		return nil, domain.ErrConflict
	} else if !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	skills, err := s.store.FindOrCreate(input.Skills)
	if err != nil {
		return nil, err
	}
	user := entities.User{
		Name:         input.Name,
		Email:        email,
		PasswordHash: string(hash),
		University:   input.University,
		Course:       input.Course,
		Rating:       5,
		Skills:       skills,
	}
	if err := s.store.Create(&user); err != nil {
		return nil, err
	}
	return s.issuePair(ctx, &user)
}

func (s *AuthService) Login(ctx context.Context, input LoginInput) (*AuthResponse, error) {
	email := normalizeEmail(input.Email)
	if !validateEmail(email) || input.Password == "" {
		return nil, domain.ErrInvalidCredentials
	}
	user, err := s.store.FindByEmail(email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)) != nil {
		return nil, domain.ErrInvalidCredentials
	}
	return s.issuePair(ctx, user)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*AuthResponse, error) {
	if refreshToken == "" {
		return nil, domain.ErrUnauthorized
	}
	hash := hashToken(refreshToken)
	session, err := s.store.FindSessionByHash(hash)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	if session.RevokedAt != nil || time.Now().After(session.ExpiresAt) {
		return nil, domain.ErrUnauthorized
	}
	if s.redis != nil {
		if err := s.redis.Get(ctx, "refresh:"+hash).Err(); err != nil {
			return nil, domain.ErrUnauthorized
		}
	}
	if err := s.store.Revoke(hash, time.Now()); err != nil {
		return nil, err
	}
	if s.redis != nil {
		_ = s.redis.Del(ctx, "refresh:"+hash).Err()
	}
	user, err := s.store.FindByID(session.UserID)
	if err != nil {
		return nil, err
	}
	return s.issuePair(ctx, user)
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return nil
	}
	hash := hashToken(refreshToken)
	if err := s.store.Revoke(hash, time.Now()); err != nil {
		return err
	}
	if s.redis != nil {
		_ = s.redis.Del(ctx, "refresh:"+hash).Err()
	}
	return nil
}

func (s *AuthService) ValidateAccessToken(tokenString string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, domain.ErrUnauthorized
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, domain.ErrUnauthorized
	}
	return claims, nil
}

func (s *AuthService) issuePair(ctx context.Context, user *entities.User) (*AuthResponse, error) {
	access, err := s.generateAccessToken(user)
	if err != nil {
		return nil, err
	}
	refresh, err := randomToken()
	if err != nil {
		return nil, err
	}
	hash := hashToken(refresh)
	expiresAt := time.Now().Add(s.cfg.RefreshTTL)
	session := entities.RefreshSession{UserID: user.ID, TokenHash: hash, ExpiresAt: expiresAt}
	if err := s.store.CreateSession(&session); err != nil {
		return nil, err
	}
	if s.redis != nil {
		ttl := time.Until(expiresAt)
		if err := s.redis.Set(ctx, "refresh:"+hash, strconv.Itoa(int(user.ID)), ttl).Err(); err != nil {
			return nil, err
		}
	}
	freshUser, err := s.store.FindByID(user.ID)
	if err == nil {
		user = freshUser
	}
	return &AuthResponse{AccessToken: access, RefreshToken: refresh, User: *user}, nil
}

func (s *AuthService) generateAccessToken(user *entities.User) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.cfg.AccessTTL)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.cfg.JWTSecret))
}

func randomToken() (string, error) {
	bytes := make([]byte, 48)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
