-- Migration 005: Add details column to audit_logs
-- This fixes the crash where backend expects 'details' column but it doesn't exist

ALTER TABLE audit_logs ADD COLUMN details TEXT;
