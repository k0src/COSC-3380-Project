import express from "express";
import  { UserBehaviorReportsService }  from "@services"
import { ContentStreamingReportsService } from "@services";
import { SystemModerationReportsService } from "@services";

const router = express.Router();

/**
 * POST /api/data-reports/generate
 * Generate reports
 */
router.post("/generate", async (req, res): Promise<void> => {
  try {
    const { reportType, dateRange, parameters } = req.body;

    if (!reportType || !dateRange || !dateRange.from || !dateRange.to) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: reportType, dateRange.from, dateRange.to"
      });
      return;
    }

    let reportData;

    switch (reportType) {
      case "daily-monthly-active-users":
        reportData = await UserBehaviorReportsService.getAudienceGrowth(
          dateRange,
          parameters?.period || 'months'
        );
        break;
      
      case "reports-by-type":
        reportData = await SystemModerationReportsService.getSimplifiedModerationReport(
          dateRange,
          parameters?.reportTypes,
          parameters?.contentType || 'all',
          parameters?.searchTerm
        );
        break;
      
      case "top-content":
        reportData = await ContentStreamingReportsService.getTopContent(
          dateRange,
          parameters?.contentType || 'songs',
          parameters?.limit || 50,
          parameters?.genre,
          parameters?.includeMetrics || false,
          parameters?.sortBy || 'streams'
        );
        break;
      
      default:
        res.status(400).json({
          success: false,
          message: `Invalid report type: ${reportType}. Valid types are: daily-monthly-active-users, reports-by-type, top-content`
        });
        return;
    }

    res.status(200).json({
      success: true,
      data: {
        reportType,
        dateRange,
        parameters,
        results: reportData,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error generating report:", error);
    
    // Extract the error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: errorMessage
    });
  }
});

/**
 * GET /api/data-reports/categories
 * Returns available report types and their parameters
 */
router.get("/categories", (req, res) => {
  const reportTypes = {
    "daily-monthly-active-users": {
      name: "User Retention",
      description: "Shows how many users came back to listen after they joined",
      parameters: [
        {
          name: "period",
          type: "select",
          label: "Group By Period",
          options: [
            { value: "days", label: "Days" },
            { value: "weeks", label: "Weeks" },
            { value: "months", label: "Months" }
          ],
          default: "months",
          required: true
        }
      ]
    },
    "reports-by-type": {
      name: "Content Moderation",
      description: "Reports, trends, and moderation insights",
      parameters: [
        {
          name: "reportTypes",
          type: "multiselect",
          label: "Report Types",
          options: [
            { value: "EXPLICIT", label: "Explicit Content" },
            { value: "VIOLENT", label: "Violent Content" },
            { value: "HATEFUL", label: "Hateful Content" },
            { value: "COPYRIGHT", label: "Copyright Violation" }
          ],
          required: false
        },
        {
          name: "contentType",
          type: "select",
          label: "Content Type",
          options: [
            { value: "all", label: "All Content" },
            { value: "song", label: "Songs" },
            { value: "user", label: "Users" },
            { value: "artist", label: "Artists" },
            { value: "album", label: "Albums" },
            { value: "playlist", label: "Playlists" }
          ],
          default: "all",
          required: true
        },
        {
          name: "searchTerm",
          type: "text",
          label: "Search by Name",
          placeholder: "Enter username, song title, album, or playlist name",
          required: false
        }
      ]
    },
    "top-content": {
      name: "Top Content",
      description: "Most popular content analytics",
      parameters: [
        {
          name: "contentType",
          type: "select",
          label: "Content Type",
          options: [
            { value: "songs", label: "Songs" },
            { value: "albums", label: "Albums" },
            { value: "artists", label: "Artists" }
          ],
          default: "songs",
          required: true
        },
        {
          name: "limit",
          type: "number",
          label: "Results Limit",
          default: 50,
          min: 1,
          max: 50,
          required: false
        },
        {
          name: "genre",
          type: "text",
          label: "Genre Filter",
          placeholder: "e.g., Rock, Pop, Jazz",
          required: false
        },
        {
          name: "sortBy",
          type: "select",
          label: "Sort By",
          options: [
            { value: "streams", label: "Total Streams" },
            { value: "alphabetical", label: "Alphabetical" },
            { value: "genre", label: "Genre" }
          ],
          default: "streams",
          required: true
        }
      ]
    }
  };

  res.status(200).json({
    success: true,
    data: reportTypes
  });
});

export default router;