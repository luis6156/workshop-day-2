import { Queue, Worker, Job } from 'bullmq';
import { AppDataSource } from '../database/data-source';
import { BatchJob, BatchJobType, BatchJobStatus } from '../database/entities/BatchJob';
import { NotificationStatus } from '../database/entities/Notification';
import { logger } from '../utils/logger';

const connectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
};

class BatchJobProcessor {
  private queue: Queue;
  private worker: Worker | null = null;
  private batchJobRepository = AppDataSource.getRepository(BatchJob);

  constructor() {
    this.queue = new Queue('batch-jobs', { connection: connectionOptions });
  }

  async start() {
    this.worker = new Worker(
      'batch-jobs',
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: connectionOptions,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    this.worker.on('completed', (job) => {
      logger.info(`Batch job completed: ${job.id}`, {
        jobId: job.id,
        duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
      });
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Batch job failed: ${job?.id}`, {
        jobId: job?.id,
        error: err.message,
      });
    });

    logger.info('✓ Batch job worker started');

    // Schedule periodic jobs
    await this.schedulePeriodicJobs();
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
      logger.info('✓ Batch job worker stopped');
    }
    await this.queue.close();
  }

  private async processJob(job: Job): Promise<any> {
    const { batchJobId, type, parameters } = job.data;

    logger.info(`Processing batch job: ${batchJobId}`, { type, parameters });

    // Update job status to running
    await this.batchJobRepository.update(batchJobId, {
      status: BatchJobStatus.RUNNING,
      startedAt: new Date(),
    });

    const startTime = Date.now();

    try {
      let result;

      switch (type) {
        case BatchJobType.NOTIFICATION_DIGEST:
          result = await this.processNotificationDigest(parameters);
          break;
        case BatchJobType.DATA_CLEANUP:
          result = await this.processDataCleanup(parameters);
          break;
        case BatchJobType.REPORT_GENERATION:
          result = await this.processReportGeneration(parameters);
          break;
        case BatchJobType.USER_SYNC:
          result = await this.processUserSync(parameters);
          break;
        default:
          throw new Error(`Unknown batch job type: ${type}`);
      }

      const duration = Date.now() - startTime;

      // Update job status to completed
      await this.batchJobRepository.update(batchJobId, {
        status: BatchJobStatus.COMPLETED,
        completedAt: new Date(),
        durationMs: duration,
        result,
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Update job status to failed
      await this.batchJobRepository.update(batchJobId, {
        status: BatchJobStatus.FAILED,
        completedAt: new Date(),
        durationMs: duration,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  private async processNotificationDigest(parameters: any): Promise<any> {
    const { userId, periodHours = 24 } = parameters;

    logger.info('Processing notification digest', { userId, periodHours });

    const notificationRepo = AppDataSource.getRepository('Notification');
    
    // Get sent notifications from the period
    const since = new Date();
    since.setHours(since.getHours() - periodHours);

    const notifications = await notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.status = :status', { status: NotificationStatus.SENT })
      .andWhere('notification.sentAt >= :since', { since })
      .getMany();

    // Group by type
    const digest = notifications.reduce((acc: any, notif: any) => {
      if (!acc[notif.type]) {
        acc[notif.type] = [];
      }
      acc[notif.type].push(notif);
      return acc;
    }, {});

    logger.info('Notification digest generated', {
      userId,
      totalNotifications: notifications.length,
    });

    return {
      userId,
      periodHours,
      totalNotifications: notifications.length,
      digest,
      generatedAt: new Date(),
    };
  }

  private async processDataCleanup(parameters: any): Promise<any> {
    const { retentionDays = 30 } = parameters;

    logger.info('Processing data cleanup', { retentionDays });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Clean up old notifications
    const notificationRepo = AppDataSource.getRepository('Notification');
    const notificationResult = await notificationRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('status IN (:...statuses)', {
        statuses: [NotificationStatus.DELIVERED, NotificationStatus.FAILED],
      })
      .execute();

    // Clean up old events
    const eventRepo = AppDataSource.getRepository('Event');
    const eventResult = await eventRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('processed = :processed', { processed: true })
      .execute();

    const deletedCount = (notificationResult.affected || 0) + (eventResult.affected || 0);

    logger.info('Data cleanup completed', {
      notificationsDeleted: notificationResult.affected,
      eventsDeleted: eventResult.affected,
    });

    return {
      retentionDays,
      notificationsDeleted: notificationResult.affected,
      eventsDeleted: eventResult.affected,
      totalDeleted: deletedCount,
      completedAt: new Date(),
    };
  }

  private async processReportGeneration(parameters: any): Promise<any> {
    const { reportType, startDate, endDate } = parameters;

    logger.info('Processing report generation', {
      reportType,
      startDate,
      endDate,
    });

    // Simulate report generation
    const notificationRepo = AppDataSource.getRepository('Notification');
    
    const stats = await notificationRepo
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('notification.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('notification.createdAt >= :startDate', { startDate })
      .andWhere('notification.createdAt <= :endDate', { endDate })
      .groupBy('notification.type')
      .addGroupBy('notification.status')
      .getRawMany();

    return {
      reportType,
      period: { startDate, endDate },
      stats,
      generatedAt: new Date(),
    };
  }

  private async processUserSync(parameters: any): Promise<any> {
    logger.info('Processing user sync', parameters);

    // Simulate user sync from external system
    const processedCount = Math.floor(Math.random() * 100) + 1;
    
    return {
      syncedUsers: processedCount,
      completedAt: new Date(),
    };
  }

  async schedulePeriodicJobs() {
    // Schedule daily cleanup job
    await this.queue.add(
      'data-cleanup',
      {
        type: BatchJobType.DATA_CLEANUP,
        parameters: { retentionDays: 30 },
      },
      {
        repeat: {
          pattern: '0 2 * * *', // Daily at 2 AM
        },
      }
    );

    logger.info('✓ Periodic jobs scheduled');
  }

  async addJob(type: BatchJobType, parameters: any = {}): Promise<string> {
    // Create batch job record
    const batchJob = this.batchJobRepository.create({
      type,
      parameters,
      status: BatchJobStatus.PENDING,
      scheduledAt: new Date(),
    });

    const savedJob = await this.batchJobRepository.save(batchJob);

    // Add to queue
    await this.queue.add(
      type,
      {
        batchJobId: savedJob.id,
        type,
        parameters,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    logger.info('Batch job added to queue', {
      jobId: savedJob.id,
      type,
    });

    return savedJob.id;
  }
}

export const batchJobProcessor = new BatchJobProcessor();
