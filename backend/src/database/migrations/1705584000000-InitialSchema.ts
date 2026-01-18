import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1705584000000 implements MigrationInterface {
  name = 'InitialSchema1705584000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "name" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "preferences" jsonb,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM('info', 'success', 'warning', 'error');
      CREATE TYPE "notification_status_enum" AS ENUM('pending', 'sent', 'failed', 'delivered');
      
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "message" character varying(500) NOT NULL,
        "type" "notification_type_enum" NOT NULL DEFAULT 'info',
        "status" "notification_status_enum" NOT NULL DEFAULT 'pending',
        "metadata" jsonb,
        "userId" uuid,
        "sentAt" TIMESTAMP,
        "deliveredAt" TIMESTAMP,
        "retryCount" integer NOT NULL DEFAULT 0,
        "errorMessage" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_userId" FOREIGN KEY ("userId") 
          REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_status_createdAt" ON "notifications" ("status", "createdAt");
      CREATE INDEX "IDX_notifications_userId_createdAt" ON "notifications" ("userId", "createdAt");
    `);

    // Create batch_jobs table
    await queryRunner.query(`
      CREATE TYPE "batch_job_type_enum" AS ENUM(
        'notification_digest', 
        'data_cleanup', 
        'report_generation', 
        'user_sync'
      );
      CREATE TYPE "batch_job_status_enum" AS ENUM(
        'pending', 
        'running', 
        'completed', 
        'failed', 
        'cancelled'
      );
      
      CREATE TABLE "batch_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "batch_job_type_enum" NOT NULL,
        "status" "batch_job_status_enum" NOT NULL DEFAULT 'pending',
        "parameters" jsonb,
        "result" jsonb,
        "processedCount" integer NOT NULL DEFAULT 0,
        "failedCount" integer NOT NULL DEFAULT 0,
        "totalCount" integer NOT NULL DEFAULT 0,
        "errorMessage" text,
        "scheduledAt" TIMESTAMP,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "durationMs" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_batch_jobs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_batch_jobs_status_scheduledAt" ON "batch_jobs" ("status", "scheduledAt");
      CREATE INDEX "IDX_batch_jobs_type_status" ON "batch_jobs" ("type", "status");
    `);

    // Create events table
    await queryRunner.query(`
      CREATE TYPE "event_type_enum" AS ENUM(
        'notification.created',
        'notification.sent',
        'notification.delivered',
        'notification.failed',
        'user.created',
        'user.updated',
        'batch_job.started',
        'batch_job.completed',
        'batch_job.failed'
      );
      
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventType" "event_type_enum" NOT NULL,
        "aggregateId" uuid NOT NULL,
        "aggregateType" character varying(100) NOT NULL,
        "payload" jsonb NOT NULL,
        "metadata" jsonb,
        "processed" boolean NOT NULL DEFAULT false,
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_eventType_createdAt" ON "events" ("eventType", "createdAt");
      CREATE INDEX "IDX_events_aggregateId_eventType" ON "events" ("aggregateId", "eventType");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TYPE "event_type_enum"`);
    
    await queryRunner.query(`DROP TABLE "batch_jobs"`);
    await queryRunner.query(`DROP TYPE "batch_job_type_enum"`);
    await queryRunner.query(`DROP TYPE "batch_job_status_enum"`);
    
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "notification_status_enum"`);
    
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
