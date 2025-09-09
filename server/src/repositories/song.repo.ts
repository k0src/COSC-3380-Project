import {Song, UUID} from "@types"

  static async getById(id: UUID): Promise<Song | null> {
    try {
  


    } catch (error) {
      console.error("Error fetching song by ID:", error);
      throw new Error("Failed to fetch song by ID");
    }
  }
}
