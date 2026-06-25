package domain

import "errors"

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrNotFound           = errors.New("resource not found")
	ErrConflict           = errors.New("resource already exists")
	ErrValidation         = errors.New("validation failed")
)
