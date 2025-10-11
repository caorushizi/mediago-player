package assets

import "embed"

//go:embed desktop/* mobile/*
var FS embed.FS
