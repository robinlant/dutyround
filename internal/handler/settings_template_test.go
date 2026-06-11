package handler

import (
	"bytes"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/robinlant/dutyround/internal/domain"
)

func TestSettingsTemplateParses(t *testing.T) {
	patterns := []string{"layouts/base.html", "partials/icons.html", "pages/settings.html"}
	if _, err := getCachedTemplate("test:settings-template", patterns); err != nil {
		t.Fatalf("settings template should parse: %v", err)
	}
}

func TestSettingsTemplateRendersGroupNav(t *testing.T) {
	patterns := []string{"layouts/base.html", "partials/icons.html", "pages/settings.html"}
	tmpl, err := getCachedTemplate("test:settings-template-render", patterns)
	if err != nil {
		t.Fatalf("settings template should parse: %v", err)
	}

	data := gin.H{
		"CurrentUser": domain.User{ID: 1, Name: "Admin", Role: "admin"},
		"CSRFToken":   "csrf",
		"Lang":        "en",
		"ActivePage":  "settings",
		"PageTitle":   "Settings",
		"SettingsPage": buildSettingsPage("en", map[string]string{
			"email_enabled":                         "true",
			"allow_past_participation":              "true",
			"allow_participant_description_edit":    "false",
			"description_edit_requires_participant": "true",
		}),
	}

	var out bytes.Buffer
	if err := tmpl.ExecuteTemplate(&out, "base", data); err != nil {
		t.Fatalf("settings template should render: %v", err)
	}
	html := out.String()
	for _, expected := range []string{
		`id="settings-email"`,
		`id="settings-duties"`,
		`href="#settings-email"`,
		`href="#settings-duties"`,
		`class="settings-nav"`,
		`class="settings-save-form settings-scroll"`,
		`id="smtp-password"`,
		`button type="submit" form="settings-save-form"`,
	} {
		if !strings.Contains(html, expected) {
			t.Fatalf("rendered settings page missing %q", expected)
		}
	}
}
