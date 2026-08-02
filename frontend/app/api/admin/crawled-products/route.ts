import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const category = searchParams.get("category") || "";
    const layer = searchParams.get("layer") || "SILVER";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    // Đường dẫn đến file dữ liệu crawl trong workspace
    let filePath = path.join(process.cwd(), "..", "data", "processed", "products_silver.json");
    if (layer === "BRONZE") {
      filePath = path.join(process.cwd(), "..", "data", "raw", "products_bronze.json");
    }

    if (!fs.existsSync(filePath)) {
      // Thử đường dẫn tương đối khác
      filePath = path.join(process.cwd(), "data", "processed", "products_silver.json");
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: `Không tìm thấy file dữ liệu: ${filePath}` },
        { status: 444 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(fileContent);

    let records: any[] = parsedData.records || parsedData.data || [];

    // Filter theo search
    if (search) {
      records = records.filter(
        (item: any) =>
          item.name?.toLowerCase().includes(search) ||
          item.id?.toLowerCase().includes(search) ||
          item.category?.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search)
      );
    }

    // Filter theo category
    if (category && category !== "Tất cả") {
      records = records.filter((item: any) => item.category === category);
    }

    const totalElements = records.length;
    const totalPages = Math.ceil(totalElements / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedRecords = records.slice(startIndex, startIndex + pageSize);

    // Lấy danh sách danh mục độc bản từ toàn bộ records
    const allCategories = Array.from(
      new Set(
        (parsedData.records || []).map((r: any) => r.category).filter(Boolean)
      )
    );

    return NextResponse.json({
      success: true,
      metadata: parsedData.metadata || { layer, total_records: totalElements },
      categories: allCategories,
      page,
      pageSize,
      totalElements,
      totalPages,
      data: paginatedRecords,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi đọc dữ liệu crawl" },
      { status: 500 }
    );
  }
}
