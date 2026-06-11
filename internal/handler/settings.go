package handler

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/robinlant/dutyround/internal/i18n"
	"github.com/robinlant/dutyround/internal/service"
)

type SettingsHandler struct {
	settings *service.SettingsService
	email    *service.EmailService
}

type SettingsPage struct {
	Groups []SettingsGroup
}

type SettingsGroup struct {
	ID       string
	NavLabel string
	Eyebrow  string
	Title    string
	Sections []SettingsSection
}

type SettingsSection struct {
	Title string
	Kind  string // "controls" | "fields"
	Items []SettingsItem
}

type SettingsItem struct {
	Kind              string // "toggle" | "input"
	Name              string
	ID                string
	RowID             string
	Label             string
	Help              string
	Type              string
	Value             string
	Placeholder       string
	Min               string
	Max               string
	Checked           bool
	Wide              bool
	Nested            bool
	PasswordToggle    bool
	PasswordShowText  string
	PasswordHideText  string
	PasswordShowLabel string
	PasswordHideLabel string
}

func NewSettingsHandler(settings *service.SettingsService, email *service.EmailService) *SettingsHandler {
	return &SettingsHandler{settings: settings, email: email}
}

func (h *SettingsHandler) Show(c *gin.Context) {
	lang := i18n.GetLang(c)
	all, err := h.settings.GetAll(c.Request.Context())
	if err != nil {
		slog.Error("settings: load failed", "error", err)
		c.Status(http.StatusInternalServerError)
		return
	}
	appConfig, err := h.settings.GetAppConfig(c.Request.Context())
	if err != nil {
		slog.Error("settings: app config load failed", "error", err)
		c.Status(http.StatusInternalServerError)
		return
	}
	all["allow_past_participation"] = boolString(appConfig.AllowPastParticipation)
	all["allow_participant_description_edit"] = boolString(appConfig.AllowParticipantDescriptionEdit)
	all["description_edit_requires_participant"] = boolString(appConfig.DescriptionEditRequiresParticipant)
	Page(c, "settings.html", pageData(c, gin.H{
		"SettingsPage": buildSettingsPage(lang, all),
		"ActivePage":   "settings",
		"PageTitle":    i18n.T(lang, "title.settings"),
	}))
}

func (h *SettingsHandler) Save(c *gin.Context) {
	lang := i18n.GetLang(c)
	settings := map[string]string{
		"smtp_host":              c.PostForm("smtp_host"),
		"smtp_port":              c.PostForm("smtp_port"),
		"smtp_username":          c.PostForm("smtp_username"),
		"smtp_password":          c.PostForm("smtp_password"),
		"sender_email":           c.PostForm("sender_email"),
		"sender_name":            c.PostForm("sender_name"),
		"max_emails_per_day":     c.PostForm("max_emails_per_day"),
		"upcoming_reminder_days": c.PostForm("upcoming_reminder_days"),
	}

	setCheckbox(settings, "email_enabled", c.PostForm("email_enabled") == "on")
	setCheckbox(settings, "allow_past_participation", c.PostForm("allow_past_participation") == "on")
	setCheckbox(settings, "allow_participant_description_edit", c.PostForm("allow_participant_description_edit") == "on")
	setCheckbox(settings, "description_edit_requires_participant", c.PostForm("description_edit_requires_participant") == "on")

	if err := h.settings.SaveAll(c.Request.Context(), settings); err != nil {
		SetFlash(c, "error", i18n.T(lang, "flash.failedSaveSettings"))
		c.Redirect(http.StatusFound, "/settings")
		return
	}
	SetFlash(c, "success", i18n.T(lang, "flash.settingsSaved"))
	c.Redirect(http.StatusFound, "/settings")
}

func setCheckbox(settings map[string]string, key string, checked bool) {
	if checked {
		settings[key] = "true"
		return
	}
	settings[key] = "false"
}

func boolString(value bool) string {
	if value {
		return "true"
	}
	return "false"
}

func buildSettingsPage(lang string, values map[string]string) SettingsPage {
	return SettingsPage{
		Groups: []SettingsGroup{
			{
				ID:       "settings-email",
				NavLabel: i18n.T(lang, "settings.tabEmail"),
				Eyebrow:  i18n.T(lang, "settings.tabEmail"),
				Title:    i18n.T(lang, "settings.emailTitle"),
				Sections: []SettingsSection{
					{
						Kind: "controls",
						Items: []SettingsItem{
							toggleSetting(lang, values, "email_enabled", "settings.enableNotifications", "settings.enableNotificationsDesc", ""),
						},
					},
					{
						Title: i18n.T(lang, "settings.smtpServer"),
						Kind:  "fields",
						Items: []SettingsItem{
							inputSetting(lang, values, "smtp_host", "settings.smtpHost", "text", "smtp.example.com", "", "", false, false),
							inputSetting(lang, values, "smtp_port", "settings.port", "number", "587", "", "", false, false),
							inputSetting(lang, values, "smtp_username", "settings.smtpUsername", "text", "user@example.com", "", "", true, false),
							inputSetting(lang, values, "smtp_password", "settings.smtpPassword", "password", "Enter SMTP password", "", "", true, true),
						},
					},
					{
						Title: i18n.T(lang, "settings.sender"),
						Kind:  "fields",
						Items: []SettingsItem{
							inputSetting(lang, values, "sender_name", "settings.senderName", "text", "DutyRound", "", "", false, false),
							inputSetting(lang, values, "sender_email", "settings.senderEmail", "email", "noreply@example.com", "", "", false, false),
						},
					},
					{
						Title: i18n.T(lang, "settings.notificationLimits"),
						Kind:  "fields",
						Items: []SettingsItem{
							inputSetting(lang, values, "max_emails_per_day", "settings.maxEmails", "number", "1", "1", "10", false, false),
							inputSetting(lang, values, "upcoming_reminder_days", "settings.reminderDays", "number", "3", "1", "30", false, false),
						},
					},
				},
			},
			{
				ID:       "settings-duties",
				NavLabel: i18n.T(lang, "settings.tabDuties"),
				Eyebrow:  i18n.T(lang, "settings.tabDuties"),
				Title:    i18n.T(lang, "settings.participationTitle"),
				Sections: []SettingsSection{
					{
						Kind: "controls",
						Items: []SettingsItem{
							toggleSetting(lang, values, "allow_past_participation", "settings.allowPastParticipation", "settings.allowPastParticipationDesc", ""),
						},
					},
					{
						Title: i18n.T(lang, "settings.descriptionEdits"),
						Kind:  "controls",
						Items: []SettingsItem{
							toggleSetting(lang, values, "allow_participant_description_edit", "settings.allowParticipantDescriptionEdit", "settings.allowParticipantDescriptionEditDesc", "allow-participant-description-edit"),
							nestedToggleSetting(lang, values, "description_edit_requires_participant", "settings.descriptionEditRequiresParticipant", "settings.descriptionEditRequiresParticipantDesc", "description-edit-requires-participant", "description-edit-requires-participant-row"),
						},
					},
				},
			},
		},
	}
}

func toggleSetting(lang string, values map[string]string, name, labelKey, helpKey, id string) SettingsItem {
	if id == "" {
		id = name
	}
	return SettingsItem{
		Kind:    "toggle",
		Name:    name,
		ID:      id,
		Label:   i18n.T(lang, labelKey),
		Help:    i18n.T(lang, helpKey),
		Checked: values[name] == "true",
	}
}

func nestedToggleSetting(lang string, values map[string]string, name, labelKey, helpKey, id, rowID string) SettingsItem {
	item := toggleSetting(lang, values, name, labelKey, helpKey, id)
	item.Nested = true
	item.RowID = rowID
	return item
}

func inputSetting(lang string, values map[string]string, name, labelKey, inputType, placeholder, min, max string, wide, passwordToggle bool) SettingsItem {
	item := SettingsItem{
		Kind:           "input",
		Name:           name,
		ID:             settingsInputID(name),
		Label:          i18n.T(lang, labelKey),
		Type:           inputType,
		Value:          values[name],
		Placeholder:    placeholder,
		Min:            min,
		Max:            max,
		Wide:           wide,
		PasswordToggle: passwordToggle,
	}
	if passwordToggle {
		item.PasswordShowText = i18n.T(lang, "password.show")
		item.PasswordHideText = i18n.T(lang, "password.hide")
		item.PasswordShowLabel = i18n.T(lang, "password.showSMTP")
		item.PasswordHideLabel = i18n.T(lang, "password.hideSMTP")
	}
	return item
}

func settingsInputID(name string) string {
	ids := map[string]string{
		"smtp_host":              "smtp-host",
		"smtp_port":              "smtp-port",
		"smtp_username":          "smtp-username",
		"smtp_password":          "smtp-password",
		"sender_name":            "sender-name",
		"sender_email":           "sender-email",
		"max_emails_per_day":     "max-emails",
		"upcoming_reminder_days": "reminder-days",
	}
	if id, ok := ids[name]; ok {
		return id
	}
	return name
}

func (h *SettingsHandler) SendTestEmail(c *gin.Context) {
	lang := i18n.GetLang(c)
	user, _ := CurrentUser(c)
	if err := h.email.SendTestEmail(c.Request.Context(), user.Email); err != nil {
		SetFlash(c, "error", i18n.T(lang, "flash.failedSendTestEmail")+err.Error())
	} else {
		SetFlash(c, "success", i18n.T(lang, "flash.testEmailSent")+user.Email)
	}
	c.Redirect(http.StatusFound, "/settings")
}
