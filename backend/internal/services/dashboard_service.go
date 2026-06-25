package services

import (
	"time"

	"edumatch/backend/internal/entities"
	"edumatch/backend/internal/repositories"
)

type DashboardService struct {
	store    *repositories.Store
	projects *ProjectService
}

type Dashboard struct {
	Stats               DashboardStats          `json:"stats"`
	MyProjects          []entities.Project      `json:"my_projects"`
	MyApplications      []entities.Application  `json:"my_applications"`
	RecommendedProjects []entities.Project      `json:"recommended_projects"`
	Notifications       []entities.Notification `json:"notifications"`
	RecentActivity      []ActivityItem          `json:"recent_activity"`
}

type DashboardStats struct {
	Projects      int   `json:"projects"`
	PendingApps   int64 `json:"pending_applications"`
	AcceptedApps  int64 `json:"accepted_applications"`
	RejectedApps  int64 `json:"rejected_applications"`
	Notifications int64 `json:"notifications"`
}

type ActivityItem struct {
	Type      string `json:"type"`
	Title     string `json:"title"`
	CreatedAt string `json:"created_at"`
}

func NewDashboardService(store *repositories.Store, projects *ProjectService) *DashboardService {
	return &DashboardService{store: store, projects: projects}
}

func (s *DashboardService) Get(userID uint) (*Dashboard, error) {
	myProjects, err := s.store.ForUser(userID)
	if err != nil {
		return nil, err
	}
	apps, err := s.store.ApplicationsForUser(userID)
	if err != nil {
		return nil, err
	}
	recommended, err := s.projects.Recommendations(userID, 6)
	if err != nil {
		return nil, err
	}
	notifications, err := s.store.NotificationsForUser(userID, 10)
	if err != nil {
		return nil, err
	}
	unread, err := s.store.UnreadCount(userID)
	if err != nil {
		return nil, err
	}
	pending, accepted, rejected, err := s.store.StatsForUser(userID)
	if err != nil {
		return nil, err
	}
	activity := make([]ActivityItem, 0, len(notifications)+len(apps))
	for _, notification := range notifications {
		activity = append(activity, ActivityItem{
			Type:      notification.Type,
			Title:     notification.Title,
			CreatedAt: notification.CreatedAt.Format(time.RFC3339),
		})
	}
	for _, app := range apps {
		activity = append(activity, ActivityItem{
			Type:      "application_" + string(app.Status),
			Title:     app.Project.Title,
			CreatedAt: app.CreatedAt.Format(time.RFC3339),
		})
	}
	if len(activity) > 10 {
		activity = activity[:10]
	}
	return &Dashboard{
		Stats: DashboardStats{
			Projects:      len(myProjects),
			PendingApps:   pending,
			AcceptedApps:  accepted,
			RejectedApps:  rejected,
			Notifications: unread,
		},
		MyProjects:          myProjects,
		MyApplications:      apps,
		RecommendedProjects: recommended,
		Notifications:       notifications,
		RecentActivity:      activity,
	}, nil
}
