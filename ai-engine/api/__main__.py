import os
import time
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Tải biến môi trường từ file .env
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

app = FastAPI(
    title="SHOPWISE AI Recommender Engine",
    description="Microservice AI & Recommender Engine kết nối Supabase PostgreSQL",
    version="1.0.0"
)

def get_db_connection():
    """Hàm tạo kết nối tới Supabase PostgreSQL"""
    try:
        connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            connect_timeout=10
        )
        return connection
    except Exception as e:
        print(f"❌ Lỗi kết nối Supabase Postgres: {e}")
        raise e

@app.get("/")
def root():
    return {
        "service": "SHOPWISE AI Recommender Engine",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Kiểm tra sức khỏe kết nối Supabase PostgreSQL"""
    start_time = time.time()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Chạy query kiểm tra
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()[0]
        
        # Lấy danh sách các bảng trong Supabase
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            LIMIT 10;
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        latency_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "status": "healthy",
            "database": "Supabase PostgreSQL",
            "host": DB_HOST,
            "latency_ms": latency_ms,
            "db_version": db_version,
            "sample_tables": tables
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Lỗi kết nối CSDL Supabase: {str(e)}"
        )

@app.get("/tables")
def get_tables():
    """Lấy toàn bộ thông tin bảng công khai trong Supabase"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT table_name, 
                   (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public';
        """)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return {"tables": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))