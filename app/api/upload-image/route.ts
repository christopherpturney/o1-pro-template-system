// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(req: NextRequest) {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size and type
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP files are allowed" },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Construct unique file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filePath = `${userId}/meal/${timestamp}-${file.name}`

    // Upload to 'meal-images' bucket
    const { data, error } = await supabase.storage
      .from("meal-images")
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error("Supabase upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ path: data.path }, { status: 200 })
  } catch (error) {
    console.error("Error in upload-image API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
