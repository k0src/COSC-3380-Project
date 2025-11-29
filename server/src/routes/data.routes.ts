import express, { Request, Response } from "express";
import DataService from "@services/data.service.js";
import { handlePgError } from "@util";
import type { DataReportParams } from "@types";

const router = express.Router();

router.get("/executive-summary", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      granularity: (req.query.granularity as any) || "day",
      compareTo: (req.query.compareTo as any) || "previous_period",
    };

    const data = await DataService.getExecutiveSummaryData(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/executive-summary:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/kpis", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      granularity: (req.query.granularity as any) || "day",
      compareTo: (req.query.compareTo as any) || "previous_period",
    };

    const data = await DataService.getKpisData(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/kpis:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/user-growth", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      granularity: (req.query.granularity as any) || "week",
    };

    const data = await DataService.getUserGrowthData(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/user-growth:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/retention-cohorts", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      granularity: (req.query.granularity as any) || "week",
      cohortBy: (req.query.cohortBy as any) || "signup_week",
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: (req.query.sortBy as string) || "cohortWeek",
      sortDirection: (req.query.sortDirection as "ASC" | "DESC") || "DESC",
    };

    const data = await DataService.getRetentionCohorts(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/retention-cohorts:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get(
  "/average-time-to-first-stream",
  async (req: Request, res: Response) => {
    try {
      const params: DataReportParams = {
        timeRange: {
          startDate:
            (req.query["timeRange[startDate]"] as string) ||
            (req.query.startDate as string) ||
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate:
            (req.query["timeRange[endDate]"] as string) ||
            (req.query.endDate as string) ||
            new Date().toISOString(),
        },
      };

      const data = await DataService.getAverageTimeToFirstStream(params);
      res.json(data);
    } catch (error: any) {
      console.error("Error in GET /data/average-time-to-first-stream:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

router.get("/engagement", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      limit: parseInt(req.query.limit as string) || 50,
      minStreams: parseInt(req.query.minStreams as string) || 10,
      groupBy: req.query.groupBy as any,
    };

    const data = await DataService.getEngagementMetrics(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/engagement:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/activity-timeline", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      granularity: (req.query.granularity as any) || "day",
    };

    const data = await DataService.getActivityTimeline(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/activity-timeline:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/churn-metrics", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      granularity: (req.query.granularity as any) || "week",
    };

    const data = await DataService.getChurnMetrics(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/churn-metrics:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/detailed-periods", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      granularity: (req.query.granularity as any) || "day",
      sortBy: (req.query.sortBy as string) || "period",
      sortDirection: (req.query.sortDirection as any) || "DESC",
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      minStreams: req.query.minStreams
        ? parseInt(req.query.minStreams as string)
        : undefined,
      minUsers: req.query.minUsers
        ? parseInt(req.query.minUsers as string)
        : undefined,
    };

    const data = await DataService.getDetailedPeriodData(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/detailed-periods:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/artist-performance", async (req: Request, res: Response) => {
  try {
    const parseArrayParam = (param: any): string[] | undefined => {
      if (!param) return undefined;
      if (Array.isArray(param)) return param;
      if (typeof param === "string") {
        try {
          const parsed = JSON.parse(param);
          return Array.isArray(parsed) ? parsed : [param];
        } catch {
          return param.split(",").filter(Boolean);
        }
      }
      return undefined;
    };

    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      limit: parseInt(req.query.limit as string) || 1000,
      offset: parseInt(req.query.offset as string) || 0,
      minStreams: req.query.minStreams
        ? parseInt(req.query.minStreams as string)
        : undefined,
      minEngagementRate: req.query.minEngagementRate
        ? parseFloat(req.query.minEngagementRate as string)
        : undefined,
      minGrowthPercent: req.query.minGrowthPercent
        ? parseFloat(req.query.minGrowthPercent as string)
        : undefined,
      searchTerm: req.query.searchTerm as string,
      artistIds: parseArrayParam(req.query.artistIds),
      genres: parseArrayParam(req.query.genres),
      albumIds: parseArrayParam(req.query.albumIds),
      sortBy: (req.query.sortBy as string) || "totalStreams",
      sortDirection:
        (req.query.sortDirection as string)?.toUpperCase() === "ASC"
          ? "ASC"
          : "DESC",
      showOnlyNew: req.query.showOnlyNew === "true",
      showOnlyTrending: req.query.showOnlyTrending === "true",
      dateRangeFilter:
        req.query["dateRangeFilter[startDate]"] &&
        req.query["dateRangeFilter[endDate]"]
          ? {
              startDate: req.query["dateRangeFilter[startDate]"] as string,
              endDate: req.query["dateRangeFilter[endDate]"] as string,
            }
          : undefined,
    };

    const data = await DataService.getArtistPerformanceMetrics(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/artist-performance:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/enhanced-tracks", async (req: Request, res: Response) => {
  try {
    const parseArrayParam = (param: any): string[] | undefined => {
      if (!param) return undefined;
      if (Array.isArray(param)) return param;
      if (typeof param === "string") {
        try {
          const parsed = JSON.parse(param);
          return Array.isArray(parsed) ? parsed : [param];
        } catch {
          return param.split(",").filter(Boolean);
        }
      }
      return undefined;
    };

    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      limit: parseInt(req.query.limit as string) || 1000,
      offset: parseInt(req.query.offset as string) || 0,
      minStreams: req.query.minStreams
        ? parseInt(req.query.minStreams as string)
        : undefined,
      minEngagementRate: req.query.minEngagementRate
        ? parseFloat(req.query.minEngagementRate as string)
        : undefined,
      minGrowthPercent: req.query.minGrowthPercent
        ? parseFloat(req.query.minGrowthPercent as string)
        : undefined,
      searchTerm: req.query.searchTerm as string,
      artistIds: parseArrayParam(req.query.artistIds),
      genres: parseArrayParam(req.query.genres),
      albumIds: parseArrayParam(req.query.albumIds),
      sortBy: (req.query.sortBy as string) || "streams",
      sortDirection:
        (req.query.sortDirection as string)?.toUpperCase() === "ASC"
          ? "ASC"
          : "DESC",
      showOnlyNew: req.query.showOnlyNew === "true",
      showOnlyTrending: req.query.showOnlyTrending === "true",
      dateRangeFilter:
        req.query["dateRangeFilter[startDate]"] &&
        req.query["dateRangeFilter[endDate]"]
          ? {
              startDate: req.query["dateRangeFilter[startDate]"] as string,
              endDate: req.query["dateRangeFilter[endDate]"] as string,
            }
          : undefined,
    };

    const data = await DataService.getEnhancedTrackPerformance(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/enhanced-tracks:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/filter-options/artists", async (req: Request, res: Response) => {
  try {
    const data = await DataService.getArtistFilterOptions();
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/filter-options/artists:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/filter-options/genres", async (req: Request, res: Response) => {
  try {
    const data = await DataService.getGenreFilterOptions();
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/filter-options/genres:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/filter-options/albums", async (req: Request, res: Response) => {
  try {
    const data = await DataService.getAlbumFilterOptions();
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/filter-options/albums:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/genre-breakdown", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
    };

    const data = await DataService.getGenreBreakdown(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/genre-breakdown:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/user-analytics", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
      sortBy: (req.query.sortBy as string) || "totalStreams",
      sortDirection:
        (req.query.sortDirection as string)?.toUpperCase() === "ASC"
          ? "ASC"
          : "DESC",
      searchTerm: req.query.searchTerm as string,
      minStreams: req.query.minStreams
        ? parseInt(req.query.minStreams as string)
        : undefined,
    };

    const data = await DataService.getUserAnalytics(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/user-analytics:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

router.get("/peak-hour", async (req: Request, res: Response) => {
  try {
    const params: DataReportParams = {
      timeRange: {
        startDate:
          (req.query["timeRange[startDate]"] as string) ||
          (req.query.startDate as string) ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate:
          (req.query["timeRange[endDate]"] as string) ||
          (req.query.endDate as string) ||
          new Date().toISOString(),
      },
    };

    const data = await DataService.getPeakActivityHour(params);
    res.json(data);
  } catch (error: any) {
    console.error("Error in GET /data/peak-hour:", error);
    const { message, statusCode } = handlePgError(error);
    res.status(statusCode).json({ error: message });
  }
});

export default router;
