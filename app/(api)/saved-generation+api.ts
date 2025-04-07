import prisma from "@/lib/prisma";

export const POST = async (req: Request) => {
  try {
    const { clerkId, id } = await req.json();
    if (!clerkId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Find user in the database
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Verify generation exists and belongs to the user
    const generation = await prisma.savedGenerations.findUnique({
      where: { id: id },
    });

    if (!generation) {
      return new Response("Generation not found", { status: 404 });
    }

    if (generation.userId !== user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Delete the generation
    await prisma.savedGenerations.delete({
      where: { id: id },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json({ success: false }, { status: 500 });
  }
};
