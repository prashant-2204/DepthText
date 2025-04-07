import prisma from "@/lib/prisma";
export const POST = async (req: Request) => {
  try {
    const { image, clerkId } = await req.json();
    const buffer = Buffer.from(image, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    // create a from data:
    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_file", blob, "image.jpg");
    console.log("Sending request to RemoveBg API ...");
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": "2J5HFmJdBV2u1BqMJCDqap4J",
      },
      body: formData,
    });
    console.log("Reponse status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log("API Error: ", errorText);
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    const resultBlob = await response.blob();
    const arrayBuffer = await resultBlob.arrayBuffer();
    console.log("Received processed image blog");
    const resultBase64 = Buffer.from(arrayBuffer).toString("base64");

    // update the db:
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        plan: true,
        id: true,
        creditsLeft: true,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = await prisma.user.update({
      where: {
        clerkId,
      },
      data: {
        creditsUsed: {
          increment: 1,
        },

        ...(user.plan === "FREE" && {
          creditsLeft: {
            decrement: 1,
          },
        }),
      },
      select: { creditsLeft: true, plan: true },
    });
    return Response.json(
      {
        data: resultBase64,
        creditsLeft: updatedUser.creditsLeft,
        plan: updatedUser.plan,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ data: { error: error } }, { status: 500 });
  }
};
