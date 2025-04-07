import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { user_id, showAds, plan } = await request.json();
    const user = await prisma.user.update({
      where: {
        clerkId: user_id,
      },
      data: {
        showAds,
        plan,
      },
    });
    return Response.json(
      {
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        error,
      },
      { status: 500 }
    );
  }
}
