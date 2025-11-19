import express, { Request, Response } from "express";
import { CommentService } from "@services";
import { handlePgError } from "@util";

const router = express.Router();

// DELETE /api/comments/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
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
});

export default router;
