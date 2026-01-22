from fastapi import FastAPI, APIRouter, HTTPException, Cookie, Response, UploadFile, File, Depends, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import aiofiles
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 168  # 7 days

# File upload directory
UPLOAD_DIR = Path('/app/uploads')
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==== MODELS ====

class UserBase(BaseModel):
    email: EmailStr
    name: str
    user_type: str  # 'institution' or 'teacher'
    picture: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    user_id: str
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SessionData(BaseModel):
    user_id: str
    session_token: str

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None
    schedule: List[dict] = []  # [{"day": "Monday", "time": "10:00", "duration": "60"}]

class ClassCreate(ClassBase):
    institution_id: str

class Class(ClassBase):
    class_id: str
    institution_id: str
    created_at: datetime

class StudentBase(BaseModel):
    name: str
    email: EmailStr
    enrollment_number: Optional[str] = None

class StudentCreate(StudentBase):
    class_id: str

class Student(StudentBase):
    student_id: str
    class_id: str
    created_at: datetime

class TeacherAssignment(BaseModel):
    teacher_id: str
    class_id: str

class MaterialBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    content: Optional[str] = None

class MaterialCreate(MaterialBase):
    class_id: str

class Material(MaterialBase):
    material_id: str
    class_id: str
    uploaded_by: str
    created_at: datetime

class AttendanceBase(BaseModel):
    date: str
    status: str  # 'present', 'absent', 'late'

class AttendanceCreate(AttendanceBase):
    student_id: str
    class_id: str

class Attendance(AttendanceBase):
    attendance_id: str
    student_id: str
    class_id: str
    marked_by: str
    created_at: datetime

class MessageBase(BaseModel):
    content: str
    recipient_id: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    message_id: str
    sender_id: str
    read: bool
    created_at: datetime

# ==== AUTH HELPERS ====

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> dict:
    token = session_token
    
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token (Emergent OAuth)
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session_doc:
        expires_at = session_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        return user_doc
    
    # Check if it's a JWT token
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        return user_doc
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==== HEALTH CHECK ====

@api_router.get("/")
async def health_check():
    return {"message": "EduFlow API is running", "status": "healthy"}

# ==== AUTH ROUTES ====

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "user_type": user_data.user_type,
        "password_hash": hashed_pw,
        "picture": user_data.picture,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id)
    user_response = User(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        user_type=user_data.user_type,
        picture=user_data.picture,
        created_at=datetime.now(timezone.utc)
    )
    
    return {"user": user_response, "token": token}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user_doc or not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc["user_id"])
    
    user_response = User(
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        name=user_doc["name"],
        user_type=user_doc["user_type"],
        picture=user_doc.get("picture"),
        created_at=datetime.fromisoformat(user_doc["created_at"]) if isinstance(user_doc["created_at"], str) else user_doc["created_at"]
    )
    
    return {"user": user_response, "token": token}

@api_router.post("/auth/session")
async def create_session_from_oauth(request: Request):
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
            headers={'X-Session-ID': session_id}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session")
        
        oauth_data = response.json()
    
    user_doc = await db.users.find_one({"email": oauth_data["email"]}, {"_id": 0})
    
    if not user_doc:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": oauth_data["email"],
            "name": oauth_data["name"],
            "user_type": "teacher",
            "picture": oauth_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    else:
        user_id = user_doc["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": oauth_data["name"],
                "picture": oauth_data.get("picture")
            }}
        )
        user_doc["name"] = oauth_data["name"]
        user_doc["picture"] = oauth_data.get("picture")
    
    session_token = oauth_data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out successfully"}

# ==== CLASSES ROUTES ====

@api_router.post("/classes", response_model=Class)
async def create_class(class_data: ClassCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "institution":
        raise HTTPException(status_code=403, detail="Only institutions can create classes")
    
    class_id = f"class_{uuid.uuid4().hex[:12]}"
    class_doc = {
        "class_id": class_id,
        "name": class_data.name,
        "description": class_data.description,
        "schedule": class_data.schedule,
        "institution_id": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.classes.insert_one(class_doc)
    
    return Class(
        class_id=class_id,
        name=class_data.name,
        description=class_data.description,
        schedule=class_data.schedule,
        institution_id=current_user["user_id"],
        created_at=datetime.now(timezone.utc)
    )

@api_router.get("/classes", response_model=List[Class])
async def get_classes(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] == "institution":
        classes = await db.classes.find({"institution_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    else:
        assignments = await db.teacher_assignments.find({"teacher_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
        class_ids = [a["class_id"] for a in assignments]
        classes = await db.classes.find({"class_id": {"$in": class_ids}}, {"_id": 0}).to_list(1000)
    
    for c in classes:
        if isinstance(c["created_at"], str):
            c["created_at"] = datetime.fromisoformat(c["created_at"])
    
    return classes

@api_router.get("/classes/{class_id}", response_model=Class)
async def get_class(class_id: str, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if isinstance(class_doc["created_at"], str):
        class_doc["created_at"] = datetime.fromisoformat(class_doc["created_at"])
    
    return Class(**class_doc)

@api_router.put("/classes/{class_id}")
async def update_class(class_id: str, class_data: ClassBase, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if current_user["user_type"] != "institution" or class_doc["institution_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.classes.update_one(
        {"class_id": class_id},
        {"$set": {
            "name": class_data.name,
            "description": class_data.description,
            "schedule": class_data.schedule
        }}
    )
    
    return {"message": "Class updated successfully"}

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, current_user: dict = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"class_id": class_id}, {"_id": 0})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if current_user["user_type"] != "institution" or class_doc["institution_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.classes.delete_one({"class_id": class_id})
    return {"message": "Class deleted successfully"}

# ==== TEACHER ASSIGNMENTS ====

@api_router.post("/teacher-assignments")
async def assign_teacher(assignment: TeacherAssignment, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "institution":
        raise HTTPException(status_code=403, detail="Only institutions can assign teachers")
    
    class_doc = await db.classes.find_one({"class_id": assignment.class_id}, {"_id": 0})
    if not class_doc or class_doc["institution_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = await db.teacher_assignments.find_one({
        "teacher_id": assignment.teacher_id,
        "class_id": assignment.class_id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Teacher already assigned")
    
    assignment_doc = {
        "assignment_id": f"assign_{uuid.uuid4().hex[:12]}",
        "teacher_id": assignment.teacher_id,
        "class_id": assignment.class_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.teacher_assignments.insert_one(assignment_doc)
    return {"message": "Teacher assigned successfully"}

@api_router.get("/teachers")
async def get_teachers(current_user: dict = Depends(get_current_user)):
    teachers = await db.users.find({"user_type": "teacher"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return teachers

# ==== STUDENTS ROUTES ====

@api_router.post("/students", response_model=Student)
async def create_student(student_data: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "institution":
        raise HTTPException(status_code=403, detail="Only institutions can add students")
    
    student_id = f"student_{uuid.uuid4().hex[:12]}"
    student_doc = {
        "student_id": student_id,
        "name": student_data.name,
        "email": student_data.email,
        "enrollment_number": student_data.enrollment_number,
        "class_id": student_data.class_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.students.insert_one(student_doc)
    
    return Student(
        student_id=student_id,
        name=student_data.name,
        email=student_data.email,
        enrollment_number=student_data.enrollment_number,
        class_id=student_data.class_id,
        created_at=datetime.now(timezone.utc)
    )

@api_router.get("/students/class/{class_id}", response_model=List[Student])
async def get_students_by_class(class_id: str, current_user: dict = Depends(get_current_user)):
    students = await db.students.find({"class_id": class_id}, {"_id": 0}).to_list(1000)
    
    for s in students:
        if isinstance(s["created_at"], str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
    
    return students

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "institution":
        raise HTTPException(status_code=403, detail="Only institutions can delete students")
    
    await db.students.delete_one({"student_id": student_id})
    return {"message": "Student deleted successfully"}

# ==== MATERIALS ROUTES ====

@api_router.post("/materials", response_model=Material)
async def create_material(material_data: MaterialCreate, current_user: dict = Depends(get_current_user)):
    material_id = f"material_{uuid.uuid4().hex[:12]}"
    material_doc = {
        "material_id": material_id,
        "title": material_data.title,
        "description": material_data.description,
        "file_url": material_data.file_url,
        "content": material_data.content,
        "class_id": material_data.class_id,
        "uploaded_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.materials.insert_one(material_doc)
    
    return Material(
        material_id=material_id,
        title=material_data.title,
        description=material_data.description,
        file_url=material_data.file_url,
        content=material_data.content,
        class_id=material_data.class_id,
        uploaded_by=current_user["user_id"],
        created_at=datetime.now(timezone.utc)
    )

@api_router.get("/materials/class/{class_id}", response_model=List[Material])
async def get_materials_by_class(class_id: str, current_user: dict = Depends(get_current_user)):
    materials = await db.materials.find({"class_id": class_id}, {"_id": 0}).to_list(1000)
    
    for m in materials:
        if isinstance(m["created_at"], str):
            m["created_at"] = datetime.fromisoformat(m["created_at"])
    
    return materials

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str, current_user: dict = Depends(get_current_user)):
    material_doc = await db.materials.find_one({"material_id": material_id}, {"_id": 0})
    if not material_doc:
        raise HTTPException(status_code=404, detail="Material not found")
    
    if material_doc["uploaded_by"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.materials.delete_one({"material_id": material_id})
    return {"message": "Material deleted successfully"}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    file_id = f"file_{uuid.uuid4().hex[:8]}"
    file_extension = file.filename.split('.')[-1]
    file_name = f"{file_id}.{file_extension}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    file_url = f"/uploads/{file_name}"
    return {"file_url": file_url, "filename": file.filename}

# ==== ATTENDANCE ROUTES ====

@api_router.post("/attendance", response_model=Attendance)
async def mark_attendance(attendance_data: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can mark attendance")
    
    existing = await db.attendance.find_one({
        "student_id": attendance_data.student_id,
        "class_id": attendance_data.class_id,
        "date": attendance_data.date
    }, {"_id": 0})
    
    if existing:
        await db.attendance.update_one(
            {
                "student_id": attendance_data.student_id,
                "class_id": attendance_data.class_id,
                "date": attendance_data.date
            },
            {"$set": {"status": attendance_data.status}}
        )
        return Attendance(**existing)
    
    attendance_id = f"attendance_{uuid.uuid4().hex[:12]}"
    attendance_doc = {
        "attendance_id": attendance_id,
        "student_id": attendance_data.student_id,
        "class_id": attendance_data.class_id,
        "date": attendance_data.date,
        "status": attendance_data.status,
        "marked_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.attendance.insert_one(attendance_doc)
    
    return Attendance(
        attendance_id=attendance_id,
        student_id=attendance_data.student_id,
        class_id=attendance_data.class_id,
        date=attendance_data.date,
        status=attendance_data.status,
        marked_by=current_user["user_id"],
        created_at=datetime.now(timezone.utc)
    )

@api_router.get("/attendance/class/{class_id}")
async def get_attendance_by_class(class_id: str, date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"class_id": class_id}
    if date:
        query["date"] = date
    
    attendance_records = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return attendance_records

# ==== MESSAGES ROUTES ====

@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    message_id = f"message_{uuid.uuid4().hex[:12]}"
    message_doc = {
        "message_id": message_id,
        "sender_id": current_user["user_id"],
        "recipient_id": message_data.recipient_id,
        "content": message_data.content,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    
    return Message(
        message_id=message_id,
        sender_id=current_user["user_id"],
        recipient_id=message_data.recipient_id,
        content=message_data.content,
        read=False,
        created_at=datetime.now(timezone.utc)
    )

@api_router.get("/messages", response_model=List[Message])
async def get_messages(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["user_id"]},
            {"recipient_id": current_user["user_id"]}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for m in messages:
        if isinstance(m["created_at"], str):
            m["created_at"] = datetime.fromisoformat(m["created_at"])
    
    return messages

@api_router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user: dict = Depends(get_current_user)):
    await db.messages.update_one(
        {"message_id": message_id, "recipient_id": current_user["user_id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Message marked as read"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()