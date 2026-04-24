package handler

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"testing"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	"github.com/robinlant/dutyround/internal/domain"
)

type authTestUserRepo struct {
	usersByID    map[int64]domain.User
	usersByEmail map[string]domain.User
	findByIDErr  error
}

func (r *authTestUserRepo) FindByID(_ context.Context, id int64) (domain.User, error) {
	if r.findByIDErr != nil {
		return domain.User{}, r.findByIDErr
	}
	if user, ok := r.usersByID[id]; ok {
		return user, nil
	}
	return domain.User{}, sql.ErrNoRows
}

func (r *authTestUserRepo) FindByName(context.Context, string) (domain.User, error) {
	return domain.User{}, sql.ErrNoRows
}

func (r *authTestUserRepo) FindByEmail(_ context.Context, email string) (domain.User, error) {
	if user, ok := r.usersByEmail[email]; ok {
		return user, nil
	}
	return domain.User{}, sql.ErrNoRows
}

func (r *authTestUserRepo) FindAll(context.Context) ([]domain.User, error) {
	users := make([]domain.User, 0, len(r.usersByID))
	for _, user := range r.usersByID {
		users = append(users, user)
	}
	return users, nil
}

func (r *authTestUserRepo) SearchByNameOrEmail(context.Context, string, int) ([]domain.User, error) {
	return nil, nil
}

func (r *authTestUserRepo) Save(context.Context, domain.User) (domain.User, error) {
	return domain.User{}, errors.New("not implemented")
}

func (r *authTestUserRepo) Delete(context.Context, int64) error {
	return errors.New("not implemented")
}

func newAuthTestRouter(repo *authTestUserRepo) *gin.Engine {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(sessions.Sessions("dutyround", cookie.NewStore([]byte("test-secret"))))
	r.Use(CSRFMiddleware())

	authH := NewAuthHandler(repo)
	r.GET("/login", authH.ShowLogin)
	r.GET("/seed-stale-session", func(c *gin.Context) {
		s := sessions.Default(c)
		s.Set(sessionUserID, int64(1))
		if err := s.Save(); err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		c.Status(http.StatusOK)
	})
	r.GET("/session-user-id", func(c *gin.Context) {
		s := sessions.Default(c)
		if _, ok := sessionUserIDFromSession(s); ok {
			c.Status(http.StatusOK)
			return
		}
		c.Status(http.StatusNoContent)
	})
	r.GET("/", AuthRequired(repo), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	return r
}

func performAuthRequest(r http.Handler, method, path string, cookies []*http.Cookie) (*httptest.ResponseRecorder, []*http.Cookie) {
	req := httptest.NewRequest(method, path, nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	return w, mergeResponseCookies(cookies, w)
}

func mergeResponseCookies(cookies []*http.Cookie, w *httptest.ResponseRecorder) []*http.Cookie {
	merged := make(map[string]*http.Cookie, len(cookies))
	for _, c := range cookies {
		merged[c.Name] = c
	}
	for _, c := range w.Result().Cookies() {
		if c.MaxAge < 0 {
			delete(merged, c.Name)
			continue
		}
		merged[c.Name] = c
	}

	names := make([]string, 0, len(merged))
	for name := range merged {
		names = append(names, name)
	}
	sort.Strings(names)

	out := make([]*http.Cookie, 0, len(names))
	for _, name := range names {
		out = append(out, merged[name])
	}
	return out
}

func TestAuthRequiredClearsStaleSessionBeforeRedirectingToLogin(t *testing.T) {
	repo := &authTestUserRepo{
		usersByID:    map[int64]domain.User{},
		usersByEmail: map[string]domain.User{},
	}
	r := newAuthTestRouter(repo)

	w, cookies := performAuthRequest(r, http.MethodGet, "/seed-stale-session", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("seed stale session: got status %d, want %d", w.Code, http.StatusOK)
	}

	w, cookies = performAuthRequest(r, http.MethodGet, "/", cookies)
	if w.Code != http.StatusFound {
		t.Fatalf("GET / with stale session: got status %d, want %d", w.Code, http.StatusFound)
	}
	if got := w.Header().Get("Location"); got != "/login" {
		t.Fatalf("GET / with stale session: got Location %q, want /login", got)
	}

	w, _ = performAuthRequest(r, http.MethodGet, "/session-user-id", cookies)
	if w.Code != http.StatusNoContent {
		t.Fatalf("session after stale redirect: got status %d, want %d", w.Code, http.StatusNoContent)
	}

	w, _ = performAuthRequest(r, http.MethodGet, "/login", cookies)
	if w.Code != http.StatusOK {
		t.Fatalf("GET /login after stale session redirect: got status %d, want %d", w.Code, http.StatusOK)
	}
}

func TestShowLoginClearsStaleSessionInsteadOfRedirecting(t *testing.T) {
	repo := &authTestUserRepo{
		usersByID:    map[int64]domain.User{},
		usersByEmail: map[string]domain.User{},
	}
	r := newAuthTestRouter(repo)

	w, cookies := performAuthRequest(r, http.MethodGet, "/seed-stale-session", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("seed stale session: got status %d, want %d", w.Code, http.StatusOK)
	}

	w, _ = performAuthRequest(r, http.MethodGet, "/login", cookies)
	if w.Code != http.StatusOK {
		t.Fatalf("GET /login with stale session: got status %d, want %d", w.Code, http.StatusOK)
	}
	if got := w.Header().Get("Location"); got != "" {
		t.Fatalf("GET /login with stale session: got Location %q, want empty", got)
	}
}

func TestShowLoginIncludesPublicLanguageAndThemeControls(t *testing.T) {
	repo := &authTestUserRepo{
		usersByID:    map[int64]domain.User{},
		usersByEmail: map[string]domain.User{},
	}
	r := newAuthTestRouter(repo)

	w, _ := performAuthRequest(r, http.MethodGet, "/login", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("GET /login: got status %d, want %d", w.Code, http.StatusOK)
	}

	body := w.Body.String()
	if !strings.Contains(body, `class="login-page-controls"`) {
		t.Fatalf("GET /login body missing login-page-controls")
	}
	if !strings.Contains(body, `class="language-select"`) {
		t.Fatalf("GET /login body missing language select")
	}
	if !strings.Contains(body, `id="theme-btn"`) {
		t.Fatalf("GET /login body missing theme button")
	}
}

func TestShowLoginUsesLocalizedMetadataForUkrainian(t *testing.T) {
	repo := &authTestUserRepo{
		usersByID:    map[int64]domain.User{},
		usersByEmail: map[string]domain.User{},
	}
	r := newAuthTestRouter(repo)

	req := httptest.NewRequest(http.MethodGet, "/login", nil)
	req.AddCookie(&http.Cookie{Name: "dr-lang", Value: "ua"})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("GET /login with ua lang: got status %d, want %d", w.Code, http.StatusOK)
	}

	body := w.Body.String()
	if !strings.Contains(body, `<html lang="uk">`) {
		t.Fatalf("GET /login body missing html lang uk: %s", body)
	}
	if !strings.Contains(body, `aria-label="Змінити мову"`) {
		t.Fatalf("GET /login body missing localized language aria-label")
	}
	if !strings.Contains(body, `data-dark-label="Перемкнути на темну тему"`) {
		t.Fatalf("GET /login body missing localized dark theme label")
	}
}
