// app/app/reports/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "../../../../lib/prisma";

// GET single report
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        // verification: true,  // ❌ REMOVED - field doesn't exist
        updates: {
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }
    
    // Increment view count
    await prisma.report.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    
    // Get similar reports
    const similarReports = await prisma.report.findMany({
      where: {
        category: report.category,
        id: { not: id },
        status: { not: "REJECTED" },
      },
      take: 5,
      select: {
        id: true,
        title: true,
        severity: true,
        date: true,
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({
      success: true,
      report: {
        ...report,
        user: report.isAnonymous ? null : report.user,
        similarReports,
      },
    });
    
  } catch (error) {
    console.error("Get report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// POST comment on report
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const body = await req.json();
    const { content } = body;
    
    if (!content || content.length < 5) {
      return NextResponse.json(
        { error: "Comment must be at least 5 characters" },
        { status: 400 }
      );
    }
    
    const comment = await prisma.comment.create({
      data: {
        content,
        reportId: id,
        userId: (session.user as any).id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    // Get report owner for notification
    const reportOwner = await prisma.report.findUnique({
      where: { id },
      include: { user: true },
    });
    
    // Create notification for report owner if not anonymous and not the commenter
    if (reportOwner && reportOwner.user && !reportOwner.isAnonymous && reportOwner.userId !== (session.user as any).id) {
      const commenterName = (session.user?.name as string) || "Someone";
      
      await prisma.notification.create({
        data: {
          userId: reportOwner.userId,
          title: "New comment on your report",
          message: `${commenterName} commented on "${reportOwner.title}"`,
          type: "REPORT_UPDATE",
          // metadata: {   // ❌ REMOVED - field doesn't exist
          //   reportId: id, 
          //   commentId: comment.id 
          // },
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      comment,
    }, { status: 201 });
    
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}