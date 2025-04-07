import prisma from "@/lib/prisma";

export const GET = async (req: Request, { id }: Record<string, string>) => {
  try {
    if (!id) {
      return Response.json(
        {
          data: { error: "Please provide id" },
        },
        {
          status: 500,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId: id,
      },
      include: {
        generations: true,
        savedGenerations: true,
      },
    });

    return Response.json({ data: user }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        data: { error },
      },
      {
        status: 500,
      }
    );
  }
};
