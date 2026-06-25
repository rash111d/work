package ws

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"edumatch/backend/internal/domain"
	"edumatch/backend/internal/services"
	"edumatch/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Hub struct {
	auth     *services.AuthService
	messages *services.MessageService
	mu       sync.RWMutex
	rooms    map[uint]map[*Client]bool
}

type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	projectID uint
	userID    uint
	send      chan any
}

type outbound struct {
	Type    string `json:"type"`
	Message any    `json:"message,omitempty"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func NewHub(auth *services.AuthService, messages *services.MessageService) *Hub {
	return &Hub{
		auth:     auth,
		messages: messages,
		rooms:    map[uint]map[*Client]bool{},
	}
}

func (h *Hub) HandleProjectSocket(c *gin.Context) {
	projectID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || projectID64 == 0 {
		response.Error(c, domain.ErrValidation)
		return
	}
	token := c.Query("token")
	if token == "" {
		token = c.GetHeader("Sec-WebSocket-Protocol")
	}
	claims, err := h.auth.ValidateAccessToken(token)
	if err != nil {
		response.Error(c, err)
		return
	}
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	client := &Client{
		hub:       h,
		conn:      conn,
		projectID: uint(projectID64),
		userID:    claims.UserID,
		send:      make(chan any, 16),
	}
	h.register(client)
	go client.writePump()
	go client.readPump()
}

func (h *Hub) register(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[client.projectID] == nil {
		h.rooms[client.projectID] = map[*Client]bool{}
	}
	h.rooms[client.projectID][client] = true
}

func (h *Hub) unregister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if room := h.rooms[client.projectID]; room != nil {
		if room[client] {
			delete(room, client)
			close(client.send)
		}
		if len(room) == 0 {
			delete(h.rooms, client.projectID)
		}
	}
}

func (h *Hub) broadcast(projectID uint, payload any) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.rooms[projectID] {
		select {
		case client.send <- payload:
		default:
			go h.unregister(client)
		}
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister(c)
		_ = c.conn.Close()
	}()
	c.conn.SetReadLimit(4096)
	_ = c.conn.SetReadDeadline(time.Now().Add(70 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(70 * time.Second))
	})
	for {
		var input services.MessageInput
		if err := c.conn.ReadJSON(&input); err != nil {
			break
		}
		message, _, err := c.hub.messages.Create(c.userID, c.projectID, input)
		if err != nil {
			c.send <- outbound{Type: "error", Message: err.Error()}
			continue
		}
		c.hub.broadcast(c.projectID, outbound{Type: "message", Message: message})
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()
	for {
		select {
		case payload, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteJSON(payload); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
