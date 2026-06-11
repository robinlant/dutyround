package service_test

import (
	"context"
	"testing"

	"github.com/robinlant/dutyround/internal/service"
)

type settingsRepoStub struct {
	values map[string]string
}

func (r settingsRepoStub) Get(_ context.Context, key string) (string, error) {
	return r.values[key], nil
}

func (r settingsRepoStub) Set(context.Context, string, string) error {
	return nil
}

func (r settingsRepoStub) GetAll(context.Context) (map[string]string, error) {
	out := make(map[string]string, len(r.values))
	for k, v := range r.values {
		out[k] = v
	}
	return out, nil
}

func (r settingsRepoStub) SetMultiple(context.Context, map[string]string) error {
	return nil
}

func TestGetAppConfig_DefaultsWhenKeysMissing(t *testing.T) {
	svc := service.NewSettingsService(settingsRepoStub{values: map[string]string{}})

	cfg, err := svc.GetAppConfig(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if !cfg.AllowPastParticipation {
		t.Fatal("AllowPastParticipation default should preserve existing behavior")
	}
	if cfg.AllowParticipantDescriptionEdit {
		t.Fatal("AllowParticipantDescriptionEdit should default to false")
	}
	if !cfg.DescriptionEditRequiresParticipant {
		t.Fatal("DescriptionEditRequiresParticipant should default to true")
	}
}

func TestGetAppConfig_ParsesStoredValues(t *testing.T) {
	svc := service.NewSettingsService(settingsRepoStub{values: map[string]string{
		"allow_past_participation":              "false",
		"allow_participant_description_edit":    "true",
		"description_edit_requires_participant": "false",
	}})

	cfg, err := svc.GetAppConfig(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if cfg.AllowPastParticipation {
		t.Fatal("AllowPastParticipation should parse false")
	}
	if !cfg.AllowParticipantDescriptionEdit {
		t.Fatal("AllowParticipantDescriptionEdit should parse true")
	}
	if cfg.DescriptionEditRequiresParticipant {
		t.Fatal("DescriptionEditRequiresParticipant should parse false")
	}
}
