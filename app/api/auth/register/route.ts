import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { z } from "zod";
import { EmailService } from "../../../../lib/email";
import crypto from "crypto";

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  // Special character no longer required
  phone: z.string().optional(),
  location: z.string().optional(),
  agreeTerms: z.boolean().optional(),
});
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.errors },
        { status: 400 }
      );
    }
    
    const { name, email, password, phone, location } = validated.data;  // ❌ Remove dateOfBirth from here
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        location: location || null,
        // dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,  // ❌ REMOVE THIS LINE
        role: "USER",
        isActive: true,
      },
    });
    
    // Store verification token in a separate table
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create email verification record
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    
    // Send verification email
    await EmailService.sendVerificationEmail(email, name, verificationCode);
    
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: "Registration successful! Please verify your email.",
      user: userWithoutPassword,
    }, { status: 201 });
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}