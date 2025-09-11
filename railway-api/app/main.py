"""
FastAPI application for church service automation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import configuration
from app.core import config

# Import routers
from app.routers import (
    parser, 
    bulletin, 
    hymn_slides, 
    scripture_slides, 
    call_to_worship_slides, 
    welcome_slides,
    message_for_all_generations_slides,
    benediction_slides,
    prayer_of_dedication_slides,
    gloria_patri_slides,
    shell_blowing,
    doxology_slides,
    postlude_slides,
    combined_slides
)

# Create FastAPI app
app = FastAPI(title="Church Service API", version="1.0.0")

# Configure CORS
origins = config.ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(parser.router, prefix="/api", tags=["parser"])
app.include_router(bulletin.router, prefix="/api", tags=["bulletin"])
app.include_router(hymn_slides.router, prefix="/api", tags=["hymn-slides"])
app.include_router(scripture_slides.router, prefix="/api", tags=["scripture-slides"])
app.include_router(call_to_worship_slides.router, prefix="/api", tags=["call-to-worship-slides"])
app.include_router(welcome_slides.router, tags=["welcome-slides"])
app.include_router(message_for_all_generations_slides.router, tags=["message-for-all-generations-slides"])
app.include_router(benediction_slides.router, tags=["benediction-slides"])
app.include_router(prayer_of_dedication_slides.router, tags=["prayer-of-dedication-slides"])
app.include_router(gloria_patri_slides.router, tags=["gloria-patri-slides"])
app.include_router(shell_blowing.router, prefix="/api", tags=["shell-blowing-slides"])
app.include_router(doxology_slides.router, prefix="/api", tags=["doxology-slides"])
app.include_router(postlude_slides.router, prefix="/api", tags=["postlude-slides"])
app.include_router(combined_slides.router, prefix="/api", tags=["combined-slides"])

@app.get("/")
async def root():
    return {"message": "Church Service API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}