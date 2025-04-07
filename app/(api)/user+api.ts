import prisma from "@/lib/prisma";

export const POST = async (req: Request) => {
  try {
    const { username, email, clerkId, provider } = await req.json();
    if (!username || !email || !provider || !clerkId) {
      return Response.json(
        {
          error: "Missing required fields",
        },
        { status: 500 }
      );
    }
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        clerkId,
        provider,
        creditsLeft: 5,
        creditsUsed: 0,
      },
    });
    return new Response(JSON.stringify({ data: newUser }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      { data: { error } },
      {
        status: 500,
      }
    );
  }
};
