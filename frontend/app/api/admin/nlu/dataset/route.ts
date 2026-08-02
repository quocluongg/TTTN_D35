import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const intentFilter = searchParams.get("intent") || "ALL";
  const searchKeyword = (searchParams.get("search") || "").toLowerCase();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);

  // Đường dẫn tới JSON dataset trong ai-engine
  const datasetPath = path.join(process.cwd(), "..", "ai-engine", "data", "nlu_electronics_dataset.json");

  if (!fs.existsSync(datasetPath)) {
    return NextResponse.json({ error: "Dataset file not found at " + datasetPath }, { status: 404 });
  }

  try {
    const rawData = fs.readFileSync(datasetPath, "utf-8");
    const dataset: any[] = JSON.parse(rawData);

    // Tính thống kê Intent Breakdown
    const stats: Record<string, number> = {};
    let totalEntitiesCount = 0;

    dataset.forEach((sample) => {
      const intent = sample.intent || "general_query";
      stats[intent] = (stats[intent] || 0) + 1;
      if (Array.isArray(sample.entities)) {
        totalEntitiesCount += sample.entities.length;
      }
    });

    // Lọc theo intent và từ khóa
    let filtered = dataset;
    if (intentFilter !== "ALL") {
      filtered = filtered.filter((s) => s.intent === intentFilter);
    }
    if (searchKeyword) {
      filtered = filtered.filter(
        (s) =>
          s.text.toLowerCase().includes(searchKeyword) ||
          s.entities?.some((e: any) => e.text.toLowerCase().includes(searchKeyword))
      );
    }

    // Paginate
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      totalSamples: dataset.length,
      filteredCount: totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      intentStats: stats,
      totalEntities: totalEntitiesCount,
      items: paginatedItems,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to read dataset: " + err.message }, { status: 500 });
  }
}
