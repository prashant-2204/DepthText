import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_method_id, payment_intent_id, customer_id, client_secret } =
      body;

    if (
      !payment_method_id ||
      !payment_intent_id ||
      !customer_id ||
      !client_secret
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
        }
      );
    }
    const paymentMethdo = stripe.paymentMethods.attach(payment_method_id, {
      customer: customer_id,
    });
    const result = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: (await paymentMethdo).id,
    });
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment confirmed successfully.",
        result,
      })
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({
        error: error,
        status: 500,
      })
    );
  }
}
