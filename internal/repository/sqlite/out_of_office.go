package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/robinlant/dutyround/internal/domain"
)

type OutOfOfficeRepository struct {
	db *sql.DB
}

func NewOutOfOfficeRepository(db *sql.DB) *OutOfOfficeRepository {
	return &OutOfOfficeRepository{db: db}
}

func (r *OutOfOfficeRepository) FindByID(ctx context.Context, id int64) (domain.OutOfOffice, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, from_date, to_date, reason FROM out_of_office WHERE id = ?`, id)
	var o domain.OutOfOffice
	err := row.Scan(&o.ID, &o.UserID, &o.From, &o.To, &o.Reason)
	return o, err
}

func (r *OutOfOfficeRepository) FindByUser(ctx context.Context, userID int64) ([]domain.OutOfOffice, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, from_date, to_date, reason FROM out_of_office WHERE user_id = ?`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.OutOfOffice
	for rows.Next() {
		var o domain.OutOfOffice
		if err := rows.Scan(&o.ID, &o.UserID, &o.From, &o.To, &o.Reason); err != nil {
			return nil, err
		}
		list = append(list, o)
	}
	return list, rows.Err()
}

func (r *OutOfOfficeRepository) FindAllForDate(ctx context.Context, date time.Time) ([]domain.OutOfOffice, error) {
	y, m, d := date.Date()
	startOfDay := time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
	endOfDay := time.Date(y, m, d, 23, 59, 59, 0, time.UTC)

	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, from_date, to_date, reason FROM out_of_office WHERE from_date <= ? AND to_date >= ?`, endOfDay, startOfDay)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.OutOfOffice
	dt := time.Date(y, m, d, 0, 0, 0, 0, time.UTC)

	for rows.Next() {
		var o domain.OutOfOffice
		if err := rows.Scan(&o.ID, &o.UserID, &o.From, &o.To, &o.Reason); err != nil {
			return nil, err
		}
		
		oy1, om1, od1 := o.From.Date()
		oy2, om2, od2 := o.To.Date()
		d1 := time.Date(oy1, om1, od1, 0, 0, 0, 0, time.UTC)
		d2 := time.Date(oy2, om2, od2, 0, 0, 0, 0, time.UTC)

		if !dt.Before(d1) && !dt.After(d2) {
			list = append(list, o)
		}
	}
	return list, rows.Err()
}


func (r *OutOfOfficeRepository) Save(ctx context.Context, o domain.OutOfOffice) (domain.OutOfOffice, error) {
	if o.ID == 0 {
		res, err := r.db.ExecContext(ctx,
			`INSERT INTO out_of_office (user_id, from_date, to_date, reason) VALUES (?, ?, ?, ?)`,
			o.UserID, o.From, o.To, o.Reason,
		)
		if err != nil {
			return o, err
		}
		o.ID, err = res.LastInsertId()
		return o, err
	}
	_, err := r.db.ExecContext(ctx,
		`UPDATE out_of_office SET user_id = ?, from_date = ?, to_date = ?, reason = ? WHERE id = ?`,
		o.UserID, o.From, o.To, o.Reason, o.ID,
	)
	return o, err
}

func (r *OutOfOfficeRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM out_of_office WHERE id = ?`, id)
	return err
}
