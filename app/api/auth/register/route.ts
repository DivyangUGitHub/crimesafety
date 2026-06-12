// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { prisma } from "../../../../lib/prisma";
// import { z } from "zod";
// import { EmailService } from "../../../../lib/email";
// import crypto from "crypto";

// // Validation schema
// const registerSchema = z.object({
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   email: z.string().email("Invalid email address"),
//   password: z.string().min(6, "Password must be at least 6 characters")
//     .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
//     .regex(/[a-z]/, "Password must contain at least one lowercase letter")
//     .regex(/[0-9]/, "Password must contain at least one number"),
//   phone: z.string().optional(),
//   location: z.string().optional(),
//   agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
// });

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
    
//     // Validate input
//     const validated = registerSchema.safeParse(body);
//     if (!validated.success) {
//       return NextResponse.json(
//         { error: validated.error.errors[0]?.message || "Validation failed" },
//         { status: 400 }
//       );
//     }
    
//     const { name, email, password, phone, location, agreeTerms } = validated.data;
    
//     // Check if user agreed to terms
//     if (!agreeTerms) {
//       return NextResponse.json(
//         { error: "You must agree to the terms and conditions" },
//         { status: 400 }
//       );
//     }
    
//     // Check if user already exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email },
//     });
    
//     if (existingUser) {
//       return NextResponse.json(
//         { error: "User already exists with this email" },
//         { status: 409 }
//       );
//     }
    
//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 12);
    
//     // Create user
//     const user = await prisma.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         phone: phone || null,
//         location: location || null,
//         role: "USER",
//         isActive: true,
//       },
//     });
    
//     // Create email verification record (optional - if email service works)
//     const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
//     try {
//       await prisma.emailVerification.create({
//         data: {
//           userId: user.id,
//           email: user.email,
//           code: verificationCode,
//           expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         },
//       });
//     } catch (emailError) {
//       console.log("Email verification record not created (table might not exist)");
//     }
    
//     // Try to send email but don't fail if it doesn't work
//     try {
//       await EmailService.sendVerificationEmail(email, name, verificationCode);
//     } catch (emailError) {
//       console.log("Email not sent (email service not configured)");
//     }
    
//     const { password: _, ...userWithoutPassword } = user;
    
//     return NextResponse.json({
//       success: true,
//       message: "Registration successful! Please login.",
//       user: userWithoutPassword,
//     }, { status: 201 });
    
//   } catch (error) {
//     console.error("Registration error:", error);
//     return NextResponse.json(
//       { error: "Internal server error: " + (error as Error).message },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  console.log("1. API called");
  
  try {
    const body = await req.json();
    console.log("2. Body:", body);
    
    const { name, email, password, phone, location, agreeTerms } = body;

    // Validation
    if (!name || name.length < 2) {
      console.log("3. Name validation failed");
      return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }
    
    if (!email || !email.includes('@')) {
      console.log("3. Email validation failed");
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    
    if (!password || password.length < 6) {
      console.log("3. Password validation failed");
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    
    if (!agreeTerms) {
      console.log("3. Terms validation failed");
      return NextResponse.json({ error: "You must agree to the terms" }, { status: 400 });
    }

    // Check existing user
    console.log("4. Checking existing user");
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log("5. User exists");
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    console.log("6. Hashing password");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log("7. Creating user");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        location: location || null,
        role: "USER",
        isActive: true,
      },
    });

    console.log("8. User created successfully:", user.id);
    
    return NextResponse.json({
      success: true,
      message: "Registration successful! Please login.",
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}