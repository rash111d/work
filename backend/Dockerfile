FROM golang:1.23-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o edumatch-api ./cmd

FROM alpine:3.20

WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/edumatch-api ./edumatch-api
COPY --from=builder /app/.env.example ./.env.example
RUN mkdir -p uploads/avatars
EXPOSE 8080
CMD ["./edumatch-api"]
