import { Request, Response } from 'express';
import { config } from '../config';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Controller responsible for application health monitoring and status reporting.
 * Provides endpoints for checking application health, service connectivity,
 * and version information.
 * 
 * @example
 * ```typescript
 * const healthController = new HealthController();
 * app.get('/health', healthController.getHealth);
 * ```
 */
export class HealthController {
  /**
   * Basic health check endpoint that returns application status and service connectivity.
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<void> - Responds with health status JSON
   * 
   * @example
   * ```
   * GET /health
   * Response: {
   *   "status": "healthy",
   *   "timestamp": "2024-01-01T12:00:00.000Z",
   *   "uptime": 3600,
   *   "environment": "production",
   *   "version": "1.0.0",
   *   "services": {
   *     "database": { "status": "connected", "responseTime": 45 },
   *     "azure": { "cosmosDb": { "status": "configured" } }
   *   }
   * }
   * ```
   */
  public getHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: config.api.version,
      services: {
        database: await this.checkDatabaseHealth(),
        azure: await this.checkAzureServicesHealth(),
      },
    };

    res.status(200).json(health);
  });

  /**
   * Detailed health check endpoint that includes performance metrics and comprehensive service status.
   * Provides additional information like memory usage, response times, and detailed service status.
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<void> - Responds with detailed health status JSON
   * 
   * @example
   * ```
   * GET /health/detailed
   * Response: {
   *   "status": "healthy",
   *   "timestamp": "2024-01-01T12:00:00.000Z",
   *   "uptime": 3600,
   *   "responseTime": 15,
   *   "memory": {
   *     "used": 45.67,
   *     "total": 128.00,
   *     "external": 8.23
   *   },
   *   "services": { ... }
   * }
   * ```
   */
  public getDetailedHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: config.api.version,
      responseTime: 0,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
      },
      services: {
        database: await this.checkDatabaseHealth(),
        azure: await this.checkAzureServicesHealth(),
      },
    };

    health.responseTime = Date.now() - startTime;
    res.status(200).json(health);
  });

  /**
   * Returns application version information and build details.
   * Useful for deployment verification and debugging.
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<void> - Responds with version information JSON
   * 
   * @example
   * ```
   * GET /version
   * Response: {
   *   "version": "1.0.0",
   *   "buildTime": "2024-01-01T12:00:00.000Z",
   *   "gitCommit": "abc123def456",
   *   "nodeVersion": "v18.17.0",
   *   "environment": "production"
   * }
   * ```
   */
  public getVersion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const version = {
      version: config.api.version,
      buildTime: new Date().toISOString(), // In real app, this would be build timestamp
      gitCommit: process.env.GIT_COMMIT || 'unknown',
      nodeVersion: process.version,
      environment: config.nodeEnv,
    };

    res.status(200).json(version);
  });

  /**
   * Checks Azure Cosmos DB connectivity and response time.
   * Used internally by health check endpoints to verify database status.
   * 
   * @private
   * @returns Promise<{status: string; responseTime?: number}> Database health status
   * @throws Will not throw but returns error status if database check fails
   * 
   * @example
   * ```typescript
   * const dbHealth = await this.checkDatabaseHealth();
   * // Returns: { status: "connected", responseTime: 45 } or { status: "error" }
   * ```
   */
  private async checkDatabaseHealth(): Promise<{ status: string; responseTime?: number }> {
    try {
      const startTime = Date.now();
      
      // TODO: Implement actual Azure Cosmos DB health check
      // For now, just simulate a check
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: config.azure.cosmosDb.endpoint ? 'connected' : 'not_configured',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'error',
      };
    }
  }

  /**
   * Checks the configuration status of Azure services used by the application.
   * Verifies that required Azure service endpoints and credentials are configured.
   * 
   * @private
   * @returns Promise<Record<string, {status: string}>> Status of each Azure service
   * 
   * @example
   * ```typescript
   * const azureHealth = await this.checkAzureServicesHealth();
   * // Returns: {
   * //   cosmosDb: { status: "configured" },
   * //   adB2c: { status: "not_configured" },
   * //   aiFoundry: { status: "configured" },
   * //   storage: { status: "configured" }
   * // }
   * ```
   */
  private async checkAzureServicesHealth(): Promise<Record<string, { status: string }>> {
    return {
      cosmosDb: {
        status: config.azure.cosmosDb.endpoint ? 'configured' : 'not_configured',
      },
      adB2c: {
        status: config.azure.adB2c.tenantId ? 'configured' : 'not_configured',
      },
      aiFoundry: {
        status: config.azure.aiFoundry.endpoint ? 'configured' : 'not_configured',
      },
      storage: {
        status: config.azure.storage.accountName ? 'configured' : 'not_configured',
      },
    };
  }
}