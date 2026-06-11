import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch user notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const isRead = searchParams.get("isRead");

    const where: any = { userId: session.user.id };
    if (isRead !== null) {
      where.isRead = isRead === "true";
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false }
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST - Create a notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, type } = body;  // ❌ Remove metadata from here

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        title,
        message,
        type: type || "GENERAL",
        // ❌ metadata: metadata || {}  - REMOVE THIS LINE
      }
    });

    return NextResponse.json({
      success: true,
      notification
    }, { status: 201 });
  } catch (error) {
    console.error("POST notification error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PUT - Mark notification as read
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true }
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("PUT notification error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId, userId: session.user.id }
    });

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("DELETE notification error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}