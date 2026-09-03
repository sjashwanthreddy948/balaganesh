import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getUserSession } from '@/lib/auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export async function POST(req: NextRequest) {
  // 1. Enforce authentication for uploads
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Login required to upload files.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 2. Strict MIME Type Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // 3. Strict File Size Validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image size exceeds the 5MB limit. Please upload a smaller image.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Safe extension derived strictly from verified MIME type (no user input used)
    let ext = '.jpg';
    if (file.type === 'image/png') ext = '.png';
    else if (file.type === 'image/webp') ext = '.webp';

    const safeFileName = `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Ensure upload directory exists securely
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeFileName}`,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image. Please try again.' },
      { status: 500 }
    );
  }
}
