import express, { Request, Response } from "express";
import { CommentService } from "@services";
import { handlePgError } from "@util";
import { authenticateToken } from "@middleware";

const router = express.Router();

/* ========================================================================== */
/*                              Comment Management                            */
/* ========================================================================== */

// DELETE /api/comments/:id
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "Comment ID is required" });
        return;
      }

      await CommentService.deleteComment(id);
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error: any) {
      console.error("Error in DELETE /comments/:id:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

// POST /api/comments/bulk-delete
router.post(
  "/bulk-delete",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { commentIds } = req.body;

      if (
        !commentIds ||
        !Array.isArray(commentIds) ||
        commentIds.length === 0
      ) {
        res.status(400).json({ error: "Comment IDs array is required" });
        return;
      }

      await CommentService.bulkDeleteComments(commentIds);
      res.status(200).json({
        message: `${commentIds.length} comment${
          commentIds.length === 1 ? "" : "s"
        } deleted successfully`,
      });
    } catch (error: any) {
      console.error("Error in POST /comments/bulk-delete:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

/* ========================================================================== */
/*                            Comment Queries                                 */
/* ========================================================================== */

// GET /api/comments/artists/:artistId
router.get(
  "/artists/:artistId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { artistId } = req.params;
      const { limit, offset } = req.query;

      if (!artistId) {
        res.status(400).json({ error: "Artist ID is required" });
        return;
      }

      const options = {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      };

      const comments = await CommentService.getCommentsByArtistId(
        artistId,
        options
      );
      res.status(200).json(comments);
    } catch (error: any) {
      console.error("Error in GET /comments/artists/:artistId:", error);
      const { message, statusCode } = handlePgError(error);
      res.status(statusCode).json({ error: message });
    }
  }
);

export default router;
